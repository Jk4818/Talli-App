
import { SessionState, Participant, Receipt, SplitSummary, ParticipantSummary, Settlement, Item } from './types';

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
  const { participants, receipts, items, globalCurrency } = session;

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
    if (!receipt) return;

    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;

    // Create a temporary, converted version of the receipt data
    const receiptItems = items.filter(i => i.receiptId === receipt.id);
    const convertedItems = receiptItems.map(item => ({ ...item, cost: Math.round(item.cost * rate) }));
    
    const convertedReceiptSubtotal = convertedItems.reduce((sum, item) => sum + item.cost, 0);
    totalItemCost += convertedReceiptSubtotal;
    
    const totalConvertedDiscounts = (receipt.discounts || []).reduce((sum, d) => sum + Math.round(d.amount * rate), 0);
    totalDiscounts += totalConvertedDiscounts;

    const subtotalAfterDiscounts = convertedReceiptSubtotal - totalConvertedDiscounts;
    
    let convertedServiceChargeAmount = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
      convertedServiceChargeAmount = Math.round(receipt.serviceCharge.value * rate);
    } else if (receipt.serviceCharge?.type === 'percentage') {
      convertedServiceChargeAmount = Math.round(subtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
    }
    totalServiceCharge += convertedServiceChargeAmount;
    
    const receiptTotalInGlobal = subtotalAfterDiscounts + convertedServiceChargeAmount;
    grandTotal += receiptTotalInGlobal;
    
    if (receipt.payerId) {
      const payerSummary = summaries.get(receipt.payerId);
      if (payerSummary) {
        payerSummary.totalPaid += receiptTotalInGlobal;
      }
    }

    const adjustedItemCosts = new Map<string, number>();
    if (convertedReceiptSubtotal > 0) {
        let distributedTotal = 0;
        convertedItems.forEach(item => {
            const adjustedCost = Math.round((item.cost / convertedReceiptSubtotal) * receiptTotalInGlobal);
            adjustedItemCosts.set(item.id, adjustedCost);
            distributedTotal += adjustedCost;
        });

        let roundingDiff = receiptTotalInGlobal - distributedTotal;
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
          const totalPercentage = Object.values(item.percentageAssignments || {}).reduce((sum, p) => sum + (p || 0), 0);
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
              if (remainder > 0) { ps.share++; remainder--; }
              else if (remainder < 0) { ps.share--; remainder++; }
            }

            participantShares.forEach(ps => {
              const summary = summaries.get(ps.pid);
              if (summary) { summary.totalShare += ps.share; }
            });
          } else {
            fallbackToEqual = true;
          }
        } else if (item.splitMode === 'exact') {
          const totalExact = Object.values(item.exactAssignments || {}).reduce((sum, p) => sum + (p || 0), 0);
          if (totalExact === item.cost && item.cost > 0) {
            let distributedAmount = 0;
            const participantShares: {pid: string, share: number}[] = [];
    
            item.assignees.forEach(pid => {
                const exactAmount = item.exactAssignments[pid] || 0;
                // Distribute the adjusted (final) cost proportionally to the original exact amounts
                const share = Math.round((exactAmount / item.cost) * adjustedCost);
                participantShares.push({ pid, share });
                distributedAmount += share;
            });
    
            let remainder = adjustedCost - distributedAmount;
            for (const s of participantShares) {
                if (remainder === 0) break;
                if (remainder > 0) { s.share++; remainder--; }
                else if (remainder < 0) { s.share--; remainder++; }
            }
    
            participantShares.forEach(s => {
                const summary = summaries.get(s.pid);
                if (summary) { summary.totalShare += s.share; }
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
  });

  summaries.forEach(summary => {
    summary.balance = summary.totalPaid - summary.totalShare;
  });

  const settlements: Settlement[] = [];
  const settlementDebtors = Array.from(summaries.values())
    .filter(s => s.balance < 0)
    .map(s => ({ ...s }))
    .sort((a, b) => a.balance - b.balance);
    
  const settlementCreditors = Array.from(summaries.values())
    .filter(s => s.balance > 0)
    .map(s => ({ ...s }))
    .sort((a, b) => b.balance - a.balance);

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < settlementDebtors.length && creditorIndex < settlementCreditors.length) {
    const debtor = settlementDebtors[debtorIndex];
    const creditor = settlementCreditors[creditorIndex];
    const amountToSettle = Math.min(-debtor.balance, creditor.balance);

    if (amountToSettle > 0.5) { 
      settlements.push({
        id: `${debtor.id}_${creditor.id}`,
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amountToSettle),
        paid: false, // This will be merged with existing state later
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
