import { SessionState, ParticipantSummary, Settlement, SplitSummary } from './types';

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
    });
  });

  // This map will track which participants have paid extra pennies due to rounding.
  const participantRoundingDebt = new Map<string, number>();
  participants.forEach(p => participantRoundingDebt.set(p.id, 0));

  let roundingOccurred = false;
  const roundedItems: SplitSummary['roundedItems'] = [];
  let totalItemCost = 0;
  let totalDiscounts = 0;
  let totalServiceCharge = 0;
  const participantIdToName = new Map(participants.map(p => [p.id, p.name]));


  // Calculate each participant's total share from all receipts
  receipts.forEach(receipt => {
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    const itemsOnReceipt = items.filter(i => i.receiptId === receipt.id);

    // Calculate participant shares of the item costs on this receipt
    const participantSharesOnReceipt = new Map<string, number>();
    participants.forEach(p => participantSharesOnReceipt.set(p.id, 0));

    itemsOnReceipt.forEach(item => {
      if (item.cost <= 0 || item.assignees.length === 0) return;
      
      const itemShares = new Map<string, number>();
      let itemCausedRounding = false;
      const adjustments: { participantName: string, amount: number }[] = [];
      
      let fallbackToEqual = item.splitMode === 'equal';

      if (item.splitMode === 'percentage') {
          const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
          if (totalPercentage === 100) {
              const calculatedShares: {id: string, share: number}[] = [];
              let distributedAmount = 0;

              // Calculate everyone's floored share first
              item.assignees.forEach(pid => {
                  const percentage = item.percentageAssignments[pid] || 0;
                  const share = Math.floor((item.cost * percentage) / 100);
                  distributedAmount += share;
                  calculatedShares.push({ id: pid, share });
              });

              let remainder = item.cost - distributedAmount;

              if (remainder > 0) {
                  roundingOccurred = true;
                  itemCausedRounding = true;

                  // Sort the assignees by who has paid the least in rounding so far.
                  const assigneesSortedByDebt = calculatedShares.sort((a, b) => (participantRoundingDebt.get(a.id) || 0) - (participantRoundingDebt.get(b.id) || 0));
                  
                  // Distribute the remainder pennies.
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
          if (totalExact === item.cost) {
              item.assignees.forEach(pid => {
                  itemShares.set(pid, item.exactAssignments?.[pid] || 0);
              });
          } else {
              fallbackToEqual = true;
          }
      }
      
      if (fallbackToEqual) {
        if (item.assignees.length > 0) {
            if (item.cost % item.assignees.length !== 0) {
                roundingOccurred = true;
                itemCausedRounding = true;
            }
            const baseShare = Math.floor(item.cost / item.assignees.length);
            let remainder = item.cost % item.assignees.length;

            item.assignees.forEach(id => {
                itemShares.set(id, baseShare);
            });

            if (remainder > 0) {
                // Sort assignees by who has paid the least in rounding so far.
                const assigneesSortedByDebt = [...item.assignees].sort((a, b) => (participantRoundingDebt.get(a) || 0) - (participantRoundingDebt.get(b) || 0));

                // Distribute the remainder pennies to those with the lowest debt.
                for (let i = 0; i < remainder; i++) {
                    const pidToAdjust = assigneesSortedByDebt[i % assigneesSortedByDebt.length];
                    itemShares.set(pidToAdjust, (itemShares.get(pidToAdjust) || 0) + 1);
                    
                    // Update their global rounding debt accumulator.
                    participantRoundingDebt.set(pidToAdjust, (participantRoundingDebt.get(pidToAdjust) || 0) + 1);
                    
                    // For the UI breakdown.
                    adjustments.push({ participantName: participantIdToName.get(pidToAdjust)!, amount: 1 });
                }
            }
        }
      }

      if (itemCausedRounding) {
        roundedItems.push({
            name: item.name,
            cost: item.cost,
            assigneesCount: item.assignees.length,
            adjustments: adjustments,
        });
      }

      itemShares.forEach((share, pid) => {
        participantSharesOnReceipt.set(pid, (participantSharesOnReceipt.get(pid) || 0) + share);
      });
    });

    const receiptSubtotal = [...participantSharesOnReceipt.values()].reduce((sum, s) => sum + s, 0);
    if (receiptSubtotal === 0) return;

    const localDiscounts = (receipt.discounts || []).reduce((sum, d) => sum + d.amount, 0);
    const subtotalAfterDiscounts = receiptSubtotal - localDiscounts;
    let localServiceCharge = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
        localServiceCharge = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge?.type === 'percentage') {
        const exactServiceCharge = subtotalAfterDiscounts * (receipt.serviceCharge.value / 100);
        localServiceCharge = Math.round(exactServiceCharge);
        if (exactServiceCharge !== localServiceCharge) {
            roundingOccurred = true;
        }
    }
    
    const distributedDiscounts = distributeAmount(localDiscounts, participantSharesOnReceipt);
    const distributedServiceCharge = distributeAmount(localServiceCharge, participantSharesOnReceipt);

    participants.forEach(p => {
        const pid = p.id;
        const subtotalShare = participantSharesOnReceipt.get(pid) || 0;
        const discountShare = distributedDiscounts.get(pid) || 0;
        const serviceChargeShare = distributedServiceCharge.get(pid) || 0;

        const finalReceiptShareLocal = subtotalShare - discountShare + serviceChargeShare;
        const finalReceiptShareGlobal = Math.round(finalReceiptShareLocal * rate);

        const summary = finalSummaries.get(pid)!;
        summary.totalShare += finalReceiptShareGlobal;
        summary.totalServiceChargeShare += Math.round(serviceChargeShare * rate);
    });

    totalItemCost += Math.round(receiptSubtotal * rate);
    totalDiscounts += Math.round(localDiscounts * rate);
    totalServiceCharge += Math.round(localServiceCharge * rate);
  });

  let totalPaid = 0;
  receipts.forEach(receipt => {
    if (!receipt.payerId) return;
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    const itemsOnReceipt = items.filter(i => i.receiptId === receipt.id);
    const subtotal = itemsOnReceipt.reduce((sum, item) => sum + item.cost, 0);
    const totalReceiptDiscounts = (receipt.discounts || []).reduce((sum, d) => sum + d.amount, 0);
    const subtotalAfterDiscounts = subtotal - totalReceiptDiscounts;
    let serviceChargeAmount = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
      serviceChargeAmount = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge?.type === 'percentage') {
      serviceChargeAmount = Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
    }
    const receiptTotalInLocalCurrency = subtotalAfterDiscounts + serviceChargeAmount;
    const receiptTotalInGlobal = Math.round(receiptTotalInLocalCurrency * rate);

    const summary = finalSummaries.get(receipt.payerId);
    if (summary) {
      summary.totalPaid += receiptTotalInGlobal;
    }
    totalPaid += receiptTotalInGlobal;
  });

  const grandTotal = totalPaid;
  let totalCalculatedShare = [...finalSummaries.values()].reduce((sum, s) => sum + s.totalShare, 0);
  let roundingDifference = grandTotal - totalCalculatedShare;
  let roundingAdjustment: SplitSummary['roundingAdjustment'] | undefined = undefined;

  if (roundingDifference !== 0) {
    roundingOccurred = true;
    const payers = [...finalSummaries.values()].filter(s => s.totalPaid > 0).sort((a,b) => b.totalPaid - a.totalPaid);
    // Find who has paid the least rounding pennies to apply the final adjustment to.
    const personToAdjust = (payers.length > 0 ? payers : [...finalSummaries.values()]).sort((a,b) => (participantRoundingDebt.get(a.id) || 0) - (participantRoundingDebt.get(b.id) || 0))[0];

    if (personToAdjust) {
        const summaryToAdjust = finalSummaries.get(personToAdjust.id);
        if(summaryToAdjust){
            summaryToAdjust.totalShare += roundingDifference;
            roundingAdjustment = {
                amount: roundingDifference,
                participantName: summaryToAdjust.name
            };
        }
    }
  }

  finalSummaries.forEach(summary => {
    summary.balance = summary.totalPaid - summary.totalShare;
  });

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
