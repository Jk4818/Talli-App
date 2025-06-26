import { SessionState, Participant, Receipt, SplitSummary, ParticipantSummary, Settlement } from './types';

// Distributes a total amount into N parts as evenly as possible (in cents)
const distributeCents = (total: number, n: number): number[] => {
  if (n === 0) return [];
  const base = Math.floor(total / n);
  let remainder = total % n;
  const parts = new Array(n).fill(base);
  for (let i = 0; i < remainder; i++) {
    parts[i]++;
  }
  return parts;
};

export const calculateSplits = (session: SessionState): SplitSummary => {
  const { participants, receipts, items } = session;

  const summaries = new Map<string, ParticipantSummary>();
  participants.forEach(p => {
    summaries.set(p.id, {
      id: p.id,
      name: p.name,
      totalPaid: 0,
      totalShare: 0,
      balance: 0,
    });
  });

  let grandTotal = 0;
  let totalItemCost = 0;
  let totalDiscounts = 0;
  let totalServiceCharge = 0;

  receipts.forEach(receipt => {
    const receiptItems = items.filter(i => i.receiptId === receipt.id);
    const receiptSubtotal = receiptItems.reduce((sum, item) => sum + item.cost, 0);
    totalItemCost += receiptSubtotal;

    const receiptDiscounts = receipt.discounts.reduce((sum, d) => sum + d.amount, 0);
    totalDiscounts += receiptDiscounts;
    
    const subtotalAfterDiscounts = receiptSubtotal - receiptDiscounts;

    let serviceChargeAmount = 0;
    if (receipt.serviceCharge.type === 'fixed') {
      serviceChargeAmount = receipt.serviceCharge.value;
    } else if (receipt.serviceCharge.type === 'percentage') {
      serviceChargeAmount = Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
    }
    totalServiceCharge += serviceChargeAmount;

    const receiptTotal = subtotalAfterDiscounts + serviceChargeAmount;
    grandTotal += receiptTotal;

    const adjustedItemCosts = new Map<string, number>();
    if (receiptSubtotal > 0) {
      let distributedTotal = 0;
      receiptItems.forEach(item => {
        const adjustedCost = Math.round((item.cost / receiptSubtotal) * receiptTotal);
        adjustedItemCosts.set(item.id, adjustedCost);
        distributedTotal += adjustedCost;
      });

      let roundingDiff = receiptTotal - distributedTotal;
      for (const itemId of adjustedItemCosts.keys()) {
        if (roundingDiff === 0) break;
        const currentCost = adjustedItemCosts.get(itemId)!;
        if (roundingDiff > 0) {
          adjustedItemCosts.set(itemId, currentCost + 1);
          roundingDiff--;
        } else {
          adjustedItemCosts.set(itemId, currentCost - 1);
          roundingDiff++;
        }
      }
    }

    receiptItems.forEach(item => {
      const adjustedCost = adjustedItemCosts.get(item.id) || 0;
      if (adjustedCost > 0 && item.assignees.length > 0) {
        
        let fallbackToEqual = item.splitMode === 'equal';
        if (item.splitMode === 'percentage') {
          const totalPercentage = Object.values(item.percentageAssignments).reduce((sum, p) => sum + (p || 0), 0);
          if (totalPercentage === 100) {
            let distributedAmount = 0;
            const participantShares: {pid: string, share: number}[] = [];

            item.assignees.forEach(pid => {
              const percentage = item.percentageAssignments[pid] || 0;
              const share = Math.round((adjustedCost * percentage) / 100);
              participantShares.push({ pid, share });
              distributedAmount += share;
            });

            let remainder = adjustedCost - distributedAmount;
            for(const ps of participantShares) {
              if (remainder === 0) break;
              if (remainder > 0) {
                ps.share++;
                remainder--;
              } else if (remainder < 0) {
                ps.share--;
                remainder++;
              }
            }

            participantShares.forEach(ps => {
              const summary = summaries.get(ps.pid);
              if (summary) {
                summary.totalShare += ps.share;
              }
            });
          } else {
            fallbackToEqual = true;
          }
        }
        
        if (fallbackToEqual) {
          const shares = distributeCents(adjustedCost, item.assignees.length);
          item.assignees.forEach((pid, index) => {
            const summary = summaries.get(pid);
            if (summary) {
              summary.totalShare += shares[index];
            }
          });
        }
      }
    });

    if (receipt.payerId) {
      const payerSummary = summaries.get(receipt.payerId);
      if (payerSummary) {
        payerSummary.totalPaid += receiptTotal;
      }
    }
  });

  summaries.forEach(summary => {
    summary.balance = summary.totalPaid - summary.totalShare;
  });

  const settlements: Settlement[] = [];
  const debtors = Array.from(summaries.values()).filter(s => s.balance < 0).sort((a,b) => a.balance - b.balance);
  const creditors = Array.from(summaries.values()).filter(s => s.balance > 0).sort((a,b) => b.balance - a.balance);

  let debtorIndex = 0;
  let creditorIndex = 0;

  while(debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountToSettle = Math.min(-debtor.balance, creditor.balance);

    if (amountToSettle > 0.5) {
        settlements.push({
            id: `${debtor.id}_${creditor.id}`,
            from: debtor.name,
            to: creditor.name,
            amount: Math.round(amountToSettle),
            paid: false,
        });
    }

    debtor.balance += amountToSettle;
    creditor.balance -= amountToSettle;

    if (Math.abs(debtor.balance) < 1) {
        debtorIndex++;
    }
    if (Math.abs(creditor.balance) < 1) {
        creditorIndex++;
    }
  }


  return {
    participantSummaries: Array.from(summaries.values()),
    settlements,
    total: grandTotal,
    totalItemCost,
    totalDiscounts,
    totalServiceCharge,
  };
};
