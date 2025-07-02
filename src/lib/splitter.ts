import { SessionState, ParticipantSummary, Settlement, SplitSummary, BreakdownEntry } from './types';

// A helper function to distribute a total amount based on shares, handling rounding.
// Returns a map of participantId -> distributedAmount
function distributeAmount(totalAmount: number, shares: Map<string, number>): Map<string, number> {
  const distributed = new Map<string, number>();
  const pidsWithShares = [...shares.keys()].filter(pid => (shares.get(pid) || 0) > 0);
  const totalShares = pidsWithShares.reduce((sum, pid) => sum + (shares.get(pid) || 0), 0);

  if (totalShares === 0) {
    return distributed;
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
  let i = 0;
  while (remainder !== 0) {
    const pid = pidsWithShares[i % pidsWithShares.length];
    const amount = remainder > 0 ? 1 : -1;
    distributed.set(pid, (distributed.get(pid) || 0) + amount);
    remainder -= amount;
    i++;
  }

  return distributed;
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
    };
  }
  
  // Initialize summaries for each participant
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
  let totalItemCost = 0;
  let totalDiscounts = 0;
  let totalServiceCharge = 0;
  const participantIdToName = new Map(participants.map(p => [p.id, p.name]));


  receipts.forEach(receipt => {
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    const itemsOnReceipt = items.filter(i => i.receiptId === receipt.id);
    const participantSharesOnReceipt = new Map<string, number>();
    participants.forEach(p => participantSharesOnReceipt.set(p.id, 0));

    // 1. Calculate and store item shares for each participant on this receipt
    itemsOnReceipt.forEach(item => {
      const itemTotalDiscount = (item.discounts || []).reduce((sum, d) => sum + d.amount, 0);
      const effectiveItemCost = item.cost - itemTotalDiscount;

      if (effectiveItemCost <= 0 || item.assignees.length === 0) return;
      
      const itemShares = new Map<string, number>();
      let itemCausedRounding = false;
      const adjustments: { participantName: string, amount: number }[] = [];
      let fallbackToEqual = item.splitMode === 'equal';

      if (item.splitMode === 'percentage') {
          const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
          if (totalPercentage === 100) {
              const calculatedShares: {id: string, share: number}[] = [];
              let distributedAmount = 0;
              item.assignees.forEach(pid => {
                  const percentage = item.percentageAssignments[pid] || 0;
                  const share = Math.floor((effectiveItemCost * percentage) / 100);
                  distributedAmount += share;
                  calculatedShares.push({ id: pid, share });
              });
              let remainder = effectiveItemCost - distributedAmount;
              if (remainder > 0) {
                  roundingOccurred = true;
                  itemCausedRounding = true;
                  const assigneesSortedByDebt = calculatedShares.sort((a, b) => (participantRoundingDebt.get(a.id) || 0) - (participantRoundingDebt.get(b.id) || 0));
                  for (let i = 0; i < remainder; i++) {
                      const assigneeToAdjust = assigneesSortedByDebt[i % assigneesSortedByDebt.length];
                      assigneeToAdjust.share += 1;
                      const pidToAdjust = assigneeToAdjust.id;
                      participantRoundingDebt.set(pidToAdjust, (participantRoundingDebt.get(pidToAdjust) || 0) + 1);
                      adjustments.push({ participantName: participantIdToName.get(pidToAdjust)!, amount: 1 });
                  }
              }
              calculatedShares.forEach(s => itemShares.set(s.id, s.share));
          } else {
              fallbackToEqual = true;
          }
      } else if (item.splitMode === 'exact') {
          const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
          if (totalExact === effectiveItemCost) {
              item.assignees.forEach(pid => {
                  itemShares.set(pid, item.exactAssignments?.[pid] || 0);
              });
          } else {
              fallbackToEqual = true;
          }
      }
      
      if (fallbackToEqual) {
        if (item.assignees.length > 0) {
            if (effectiveItemCost % item.assignees.length !== 0) {
                roundingOccurred = true;
                itemCausedRounding = true;
            }
            const baseShare = Math.floor(effectiveItemCost / item.assignees.length);
            let remainder = effectiveItemCost % item.assignees.length;
            item.assignees.forEach(id => itemShares.set(id, baseShare));
            if (remainder > 0) {
                const assigneesSortedByDebt = [...item.assignees].sort((a, b) => (participantRoundingDebt.get(a) || 0) - (participantRoundingDebt.get(b) || 0));
                for (let i = 0; i < remainder; i++) {
                    const pidToAdjust = assigneesSortedByDebt[i % assigneesSortedByDebt.length];
                    itemShares.set(pidToAdjust, (itemShares.get(pidToAdjust) || 0) + 1);
                    participantRoundingDebt.set(pidToAdjust, (participantRoundingDebt.get(pidToAdjust) || 0) + 1);
                    adjustments.push({ participantName: participantIdToName.get(pidToAdjust)!, amount: 1 });
                }
            }
        }
      }

      if (itemCausedRounding) {
        roundedItems.push({ name: item.name, cost: effectiveItemCost, assigneesCount: item.assignees.length, adjustments });
      }

      itemShares.forEach((share, pid) => {
        const summary = finalSummaries.get(pid)!;
        summary.breakdown.items.push({ itemId: item.id, description: item.name, amount: Math.round(share * rate), receiptId: receipt.id });
        participantSharesOnReceipt.set(pid, (participantSharesOnReceipt.get(pid) || 0) + share);
      });
    });

    const receiptSubtotal = [...participantSharesOnReceipt.values()].reduce((sum, s) => sum + s, 0);
    totalItemCost += Math.round(itemsOnReceipt.reduce((sum, i) => sum + i.cost, 0) * rate);
    const totalItemLevelDiscounts = itemsOnReceipt.reduce((sum, i) => sum + (i.discounts || []).reduce((s, d) => s + d.amount, 0), 0);

    // 2. Distribute receipt-level discounts and service charges based on item shares
    (receipt.discounts || []).forEach(discount => {
      totalDiscounts += Math.round(discount.amount * rate);
      const distributedDiscount = distributeAmount(discount.amount, participantSharesOnReceipt);
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

    const subtotalAfterReceiptDiscounts = receiptSubtotal - (receipt.discounts || []).reduce((sum, d) => sum + d.amount, 0);
    let localServiceCharge = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
        localServiceCharge = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge?.type === 'percentage') {
        const exactServiceCharge = subtotalAfterReceiptDiscounts * (receipt.serviceCharge.value / 100);
        localServiceCharge = Math.round(exactServiceCharge);
        if (exactServiceCharge !== localServiceCharge) roundingOccurred = true;
    }
    
    totalServiceCharge += Math.round(localServiceCharge * rate);
    if (localServiceCharge > 0) {
      const distributedServiceCharge = distributeAmount(localServiceCharge, participantSharesOnReceipt);
      distributedServiceCharge.forEach((amount, pid) => {
        const summary = finalSummaries.get(pid)!;
        const serviceChargeShare = Math.round(amount * rate);
        summary.breakdown.serviceCharges.push({ description: 'Service Charge / Tip', amount: serviceChargeShare, receiptId: receipt.id });
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
      // Service charge is usually calculated on the subtotal after receipt-level discounts. Item-level discounts are handled at the item line.
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

  if (roundingDifference !== 0) {
    roundingOccurred = true;
    const payers = [...finalSummaries.values()].filter(s => s.totalPaid > 0).sort((a,b) => b.totalPaid - a.totalPaid);
    const personToAdjust = (payers.length > 0 ? payers : [...finalSummaries.values()]).sort((a,b) => (participantRoundingDebt.get(a.id) || 0) - (participantRoundingDebt.get(b.id) || 0))[0];

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
  };
};
