import { SessionState, ParticipantSummary, Settlement, SplitSummary, BreakdownEntry, Item } from './types';

// A helper function to distribute a total amount based on shares, handling rounding.
// Returns a map of participantId -> distributedAmount and any rounding adjustments made.
function distributeAmount(
  totalAmount: number, 
  shares: Map<string, number>,
  participantIdToName: Map<string, string>
): { distributed: Map<string, number>, adjustments: { participantName: string, amount: number }[] } {
  const distributed = new Map<string, number>();
  const adjustments: { participantName: string, amount: number }[] = [];
  // Sort the participants to ensure deterministic distribution of rounding errors
  const pidsWithShares = [...shares.keys()]
    .filter(pid => (shares.get(pid) || 0) > 0)
    .sort((a,b) => a.localeCompare(b));

  const totalShares = pidsWithShares.reduce((sum, pid) => sum + (shares.get(pid) || 0), 0);

  if (totalShares === 0 || totalAmount === 0) {
    pidsWithShares.forEach(pid => distributed.set(pid, 0));
    return { distributed, adjustments };
  }

  let amountDistributed = 0;
  pidsWithShares.forEach((pid) => {
    const share = shares.get(pid) || 0;
    const proportion = share / totalShares;
    const distributedAmount = Math.round(totalAmount * proportion);
    distributed.set(pid, distributedAmount);
    amountDistributed += distributedAmount;
  });

  // Distribute rounding difference
  let remainder = totalAmount - amountDistributed;
  if (remainder !== 0) {
    let i = 0;
    while (remainder !== 0) {
        const pid = pidsWithShares[i % pidsWithShares.length];
        const amount = remainder > 0 ? 1 : -1;
        distributed.set(pid, (distributed.get(pid) || 0) + amount);
        adjustments.push({ participantName: participantIdToName.get(pid)!, amount });
        remainder -= amount;
        i++;
    }
  }

  return { distributed, adjustments };
}


export const calculateSplits = (session: SessionState): SplitSummary => {
  const { participants, receipts, items, globalCurrency } = session;

  if (participants.length === 0) {
    return {
      participantSummaries: [],
      settlements: [],
      total: 0,
      totalItemCost: 0,
      totalDiscounts: 0,
      totalServiceCharge: 0,
      roundingAdjustment: undefined,
      roundingOccurred: false,
      roundedItems: [],
      discountRounding: [],
      serviceChargeRounding: [],
    };
  }
  
  const finalSummaries = new Map<string, ParticipantSummary>();
  participants.forEach(p => {
    finalSummaries.set(p.id, {
      id: p.id,
      name: p.name,
      totalPaid: 0,
      totalShare: 0,
      totalServiceChargeShare: 0,
      balance: 0,
      breakdown: { items: [], discounts: [], serviceCharges: [] },
    });
  });

  const participantRoundingDebt = new Map<string, number>();
  participants.forEach(p => participantRoundingDebt.set(p.id, 0));

  let roundingOccurred = false;
  const roundedItems: SplitSummary['roundedItems'] = [];
  const discountRoundings: SplitSummary['discountRounding'] = [];
  const serviceChargeRoundings: SplitSummary['serviceChargeRounding'] = [];
  let totalItemCost = 0;
  let totalDiscounts = 0;
  let totalServiceCharge = 0;
  const participantIdToName = new Map(participants.map(p => [p.id, p.name]));


  receipts.forEach(receipt => {
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    const itemsOnReceipt = items.filter(i => i.receiptId === receipt.id);
    const participantGrossSharesOnReceipt = new Map<string, number>();
    participants.forEach(p => participantGrossSharesOnReceipt.set(p.id, 0));

    // 1. Calculate NET shares for each item, then decompose into GROSS and DISCOUNT for the breakdown.
    itemsOnReceipt.forEach(item => {
      const itemTotalDiscount = (item.discounts || []).reduce((sum, d) => sum + d.amount, 0);
      const effectiveItemCost = item.cost - itemTotalDiscount;

      if (item.assignees.length === 0) {
        // Only track the item's gross cost for the total, but no shares.
        // Gross cost is still added to the subtotal for receipt-level calculations
        participantGrossSharesOnReceipt.set('unassigned', (participantGrossSharesOnReceipt.get('unassigned') || 0) + item.cost);
        return;
      }

      const netShares = new Map<string, number>();
      let itemCausedRounding = false;
      const adjustments: { participantName: string, amount: number }[] = [];

      // Logic to determine net shares for each assignee for this one item
      if (effectiveItemCost > 0) {
        let fallbackToEqual = item.splitMode === 'equal';

        if (item.splitMode === 'percentage') {
          const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
          if (totalPercentage === 100) {
            let distributedAmount = 0;
            const calculatedShares = item.assignees.map(pid => {
                const percentage = item.percentageAssignments[pid] || 0;
                const share = Math.floor((effectiveItemCost * percentage) / 100);
                distributedAmount += share;
                return { id: pid, share };
            });
            let remainder = effectiveItemCost - distributedAmount;
            if (remainder !== 0) {
                roundingOccurred = true;
                itemCausedRounding = true;
                const assigneesSortedByDebt = calculatedShares.sort((a, b) => {
                  const debtA = participantRoundingDebt.get(a.id) || 0;
                  const debtB = participantRoundingDebt.get(b.id) || 0;
                  if (debtA !== debtB) return debtA - debtB;
                  return a.id.localeCompare(b.id);
                });
                
                const amountToDistribute = remainder > 0 ? 1 : -1;
                for (let i = 0; i < Math.abs(remainder); i++) {
                    const assigneeToAdjust = assigneesSortedByDebt[i % assigneesSortedByDebt.length];
                    assigneeToAdjust.share += amountToDistribute;
                    const pidToAdjust = assigneeToAdjust.id;
                    participantRoundingDebt.set(pidToAdjust, (participantRoundingDebt.get(pidToAdjust) || 0) + amountToDistribute);
                    adjustments.push({ participantName: participantIdToName.get(pidToAdjust)!, amount: amountToDistribute });
                }
            }
            calculatedShares.forEach(s => netShares.set(s.id, s.share));
          } else { fallbackToEqual = true; }
        } else if (item.splitMode === 'exact') {
          const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
          if (totalExact === effectiveItemCost) {
            item.assignees.forEach(pid => netShares.set(pid, item.exactAssignments[pid] || 0));
          } else { fallbackToEqual = true; }
        }
        
        if (fallbackToEqual) {
          if (effectiveItemCost % item.assignees.length !== 0) {
              roundingOccurred = true;
              itemCausedRounding = true;
          }
          const baseShare = Math.floor(effectiveItemCost / item.assignees.length);
          let remainder = effectiveItemCost % item.assignees.length;
          item.assignees.forEach(id => netShares.set(id, baseShare));
          if (remainder > 0) {
            const assigneesSortedByDebt = [...item.assignees].sort((a, b) => {
              const debtA = participantRoundingDebt.get(a) || 0;
              const debtB = participantRoundingDebt.get(b) || 0;
              if (debtA !== debtB) return debtA - debtB;
              return a.localeCompare(b); // a stable sort for equal debt
            });
            for (let i = 0; i < remainder; i++) {
                const pidToAdjust = assigneesSortedByDebt[i % assigneesSortedByDebt.length];
                netShares.set(pidToAdjust, (netShares.get(pidToAdjust) || 0) + 1);
                participantRoundingDebt.set(pidToAdjust, (participantRoundingDebt.get(pidToAdjust) || 0) + 1);
                adjustments.push({ participantName: participantIdToName.get(pidToAdjust)!, amount: 1 });
            }
          }
        }
      }

      if (itemCausedRounding) {
        roundedItems.push({ name: item.name, cost: effectiveItemCost, assigneesCount: item.assignees.length, adjustments });
      }

      // Decompose net shares into gross and discount shares for the breakdown
      netShares.forEach((netShare, pid) => {
        const summary = finalSummaries.get(pid)!;
        const proportion = effectiveItemCost > 0 ? netShare / effectiveItemCost : (item.assignees.length > 0 ? 1 / item.assignees.length : 0);
        
        const grossShare = item.cost * proportion;

        summary.breakdown.items.push({
          itemId: item.id,
          description: item.name,
          amount: Math.round(grossShare * rate),
          receiptId: receipt.id
        });

        (item.discounts || []).forEach(itemDiscount => {
            const individualDiscountShare = itemDiscount.amount * proportion;
             if (individualDiscountShare > 0) {
                summary.breakdown.discounts.push({
                    itemId: item.id,
                    description: `Discount on ${item.name}`,
                    amount: -Math.round(individualDiscountShare * rate),
                    receiptId: receipt.id,
                    isDiscount: true,
                });
            }
        });
        
        participantGrossSharesOnReceipt.set(pid, (participantGrossSharesOnReceipt.get(pid) || 0) + grossShare);
      });
    });

    totalItemCost += Math.round(itemsOnReceipt.reduce((sum, i) => sum + i.cost, 0) * rate);
    const totalItemLevelDiscounts = itemsOnReceipt.reduce((sum, i) => sum + (i.discounts || []).reduce((s, d) => s + d.amount, 0), 0);

    // 2. Distribute receipt-level discounts and service charges based on GROSS item shares
    (receipt.discounts || []).forEach(discount => {
      totalDiscounts += Math.round(discount.amount * rate);
      const { distributed: distributedDiscount, adjustments: discountAdjustments } = distributeAmount(discount.amount, participantGrossSharesOnReceipt, participantIdToName);
      if (discountAdjustments.length > 0) {
        roundingOccurred = true;
        discountRoundings.push({
            receiptName: receipt.name,
            description: discount.name,
            totalAmount: discount.amount,
            adjustments: discountAdjustments
        });
      }

      distributedDiscount.forEach((amount, pid) => {
        finalSummaries.get(pid)!.breakdown.discounts.push({
          description: discount.name,
          amount: -Math.round(amount * rate),
          receiptId: receipt.id,
          isDiscount: true,
        });
      });
    });
    totalDiscounts += Math.round(totalItemLevelDiscounts * rate);
    
    let localServiceCharge = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
        localServiceCharge = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge?.type === 'percentage') {
        // Service charge is calculated on the gross subtotal MINUS receipt-level discounts.
        const serviceChargeBase = [...participantGrossSharesOnReceipt.values()].reduce((s, c) => s + c, 0) - (receipt.discounts || []).reduce((t, d) => t + d.amount, 0);
        localServiceCharge = Math.round(serviceChargeBase * (receipt.serviceCharge.value / 100));
    }
    
    totalServiceCharge += Math.round(localServiceCharge * rate);
    if (localServiceCharge > 0) {
      const { distributed: distributedServiceCharge, adjustments: serviceChargeAdjustments } = distributeAmount(localServiceCharge, participantGrossSharesOnReceipt, participantIdToName);
      if (serviceChargeAdjustments.length > 0) {
        roundingOccurred = true;
        serviceChargeRoundings.push({
            receiptName: receipt.name,
            description: `Fee on "${receipt.name}"`,
            totalAmount: localServiceCharge,
            adjustments: serviceChargeAdjustments
        });
      }
      distributedServiceCharge.forEach((amount, pid) => {
        const summary = finalSummaries.get(pid)!;
        const serviceChargeShare = Math.round(amount * rate);
        const description = `Tip/Fee on "${receipt.name}"`;
        summary.breakdown.serviceCharges.push({ description, amount: serviceChargeShare, receiptId: receipt.id });
        summary.totalServiceChargeShare += serviceChargeShare;
      });
    }
  });

  // 3. Calculate total paid by each participant
  let totalPaid = 0;
  receipts.forEach(receipt => {
    if (!receipt.payerId) return;
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    const itemsOnReceipt = items.filter(i => i.receiptId === receipt.id);
    const subtotal = itemsOnReceipt.reduce((sum, item) => sum + item.cost, 0);
    
    const totalReceiptLevelDiscounts = (receipt.discounts || []).reduce((sum, d) => sum + d.amount, 0);
    const totalItemLevelDiscounts = itemsOnReceipt.reduce((sum, i) => sum + (i.discounts || []).reduce((s,d) => s + d.amount, 0), 0);
    
    const subtotalAfterDiscounts = subtotal - totalReceiptLevelDiscounts - totalItemLevelDiscounts;

    let serviceChargeAmount = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
      serviceChargeAmount = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge?.type === 'percentage') {
      const serviceChargeBase = subtotal - totalReceiptLevelDiscounts;
      serviceChargeAmount = Math.round(serviceChargeBase * (receipt.serviceCharge.value / 100));
    }
    const receiptTotalInLocalCurrency = subtotalAfterDiscounts + serviceChargeAmount;
    const receiptTotalInGlobal = Math.round(receiptTotalInLocalCurrency * rate);

    const summary = finalSummaries.get(receipt.payerId);
    if (summary) {
      summary.totalPaid += receiptTotalInGlobal;
    }
    totalPaid += receiptTotalInGlobal;
  });

  // 4. Calculate final share from breakdown and apply session-wide rounding if necessary
  finalSummaries.forEach(summary => {
    const itemsTotal = summary.breakdown.items.reduce((s, i) => s + i.amount, 0);
    const discountsTotal = summary.breakdown.discounts.reduce((s, d) => s + d.amount, 0);
    const serviceChargesTotal = summary.breakdown.serviceCharges.reduce((s, sc) => s + sc.amount, 0);
    summary.totalShare = itemsTotal + discountsTotal + serviceChargesTotal;
  });

  const grandTotal = totalPaid;
  let totalCalculatedShare = [...finalSummaries.values()].reduce((sum, s) => sum + s.totalShare, 0);
  let roundingDifference = grandTotal - totalCalculatedShare;
  let roundingAdjustment: SplitSummary['roundingAdjustment'] | undefined = undefined;

  if (Math.abs(roundingDifference) > 0.5) { // Only adjust if difference is more than half a cent
    roundingOccurred = true;
    const payers = [...finalSummaries.values()].filter(s => s.totalPaid > 0).sort((a,b) => b.totalPaid - a.totalPaid);
    const personToAdjust = (payers.length > 0 ? payers : [...finalSummaries.values()]).sort((a,b) => {
        const debtA = participantRoundingDebt.get(a.id) || 0;
        const debtB = participantRoundingDebt.get(b.id) || 0;
        if (debtA !== debtB) return debtA - debtB;
        return a.id.localeCompare(b.id);
    })[0];

    if (personToAdjust) {
        const summaryToAdjust = finalSummaries.get(personToAdjust.id);
        if(summaryToAdjust){
            summaryToAdjust.totalShare += roundingDifference;
            roundingAdjustment = { amount: roundingDifference, participantName: summaryToAdjust.name };
        }
    }
  }

  // 5. Final balance calculation
  finalSummaries.forEach(summary => {
    summary.balance = summary.totalPaid - summary.totalShare;
  });

  // 6. Generate settlements
  const settlements: Settlement[] = [];
  const debtors = [...finalSummaries.values()].filter(s => s.balance < -0.5).map(s => ({ ...s }));
  const creditors = [...finalSummaries.values()].filter(s => s.balance > 0.5).map(s => ({ ...s }));
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      settlements.push({
          id: `${debtor.id}_${creditor.id}`,
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount),
          paid: false,
      });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 1) debtors.shift();
      if (Math.abs(creditor.balance) < 1) creditors.shift();
  }
  
  return {
    participantSummaries: Array.from(finalSummaries.values()),
    settlements,
    total: grandTotal,
    totalItemCost,
    totalDiscounts,
    totalServiceCharge,
    roundingAdjustment,
    roundingOccurred,
    roundedItems,
    discountRounding: discountRoundings,
    serviceChargeRounding: serviceChargeRoundings,
  };
};
