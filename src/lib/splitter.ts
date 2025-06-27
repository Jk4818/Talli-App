import { SessionState, ParticipantSummary, Settlement, SplitSummary } from './types';

export const calculateSplits = (session: SessionState): SplitSummary => {
  const { participants, receipts, items, globalCurrency } = session;

  const summaries = new Map<string, ParticipantSummary>();
  participants.forEach(p => {
    summaries.set(p.id, {
      id: p.id,
      name: p.name,
      totalPaid: 0,
      totalShare: 0, // Use as float for now
      totalServiceChargeShare: 0, // Use as float for now
      balance: 0,
    });
  });

  if (participants.length === 0) {
    return {
        participantSummaries: [],
        settlements: [],
        total: 0,
        totalItemCost: 0,
        totalDiscounts: 0,
        totalServiceCharge: 0,
    };
  }

  let grandTotal = 0;
  let totalItemCost = 0;
  let totalDiscounts = 0;
  let totalServiceCharge = 0;

  receipts.forEach(receipt => {
    if (!receipt) return;
    const rate = (receipt.currency !== globalCurrency && receipt.exchangeRate) ? receipt.exchangeRate : 1;
    
    // Calculate receipt total as an integer, this is the ground truth
    const integerReceiptSubtotal = items.filter(i => i.receiptId === receipt.id).reduce((sum, item) => sum + Math.round(item.cost * rate), 0);
    const integerTotalDiscounts = (receipt.discounts || []).reduce((sum, d) => sum + Math.round(d.amount * rate), 0);
    const integerSubtotalAfterDiscounts = integerReceiptSubtotal - integerTotalDiscounts;
    let integerServiceChargeAmount = 0;
    if (receipt.serviceCharge?.type === 'fixed') {
      integerServiceChargeAmount = Math.round(receipt.serviceCharge.value * rate);
    } else if (receipt.serviceCharge?.type === 'percentage') {
      integerServiceChargeAmount = Math.round(integerSubtotalAfterDiscounts * (receipt.serviceCharge.value / 100));
    }
    const receiptTotalInGlobal = integerSubtotalAfterDiscounts + integerServiceChargeAmount; // This is an integer
    grandTotal += receiptTotalInGlobal;

    // Accumulate totals for the summary display
    totalItemCost += integerReceiptSubtotal;
    totalDiscounts += integerTotalDiscounts;
    totalServiceCharge += integerServiceChargeAmount;
    
    if (receipt.payerId) {
      summaries.get(receipt.payerId)!.totalPaid += receiptTotalInGlobal;
    }

    // Now, distribute this `receiptTotalInGlobal` among items and participants using float math
    const floatReceiptSubtotal = items.filter(i => i.receiptId === receipt.id).reduce((sum, i) => sum + (i.cost * rate), 0);

    items.filter(i => i.receiptId === receipt.id).forEach(item => {
      const itemCostFloat = item.cost * rate;
      if (itemCostFloat <= 0 || item.assignees.length === 0) return;
      
      const itemProportionOfReceipt = floatReceiptSubtotal > 0 ? itemCostFloat / floatReceiptSubtotal : 0;
      const itemFinalValue = itemProportionOfReceipt * receiptTotalInGlobal;

      const itemShares = new Map<string, number>();
      
      let fallbackToEqual = item.splitMode === 'equal';
      
      if (item.splitMode === 'percentage') {
        const totalPercentage = item.assignees.reduce((sum, pid) => sum + (item.percentageAssignments?.[pid] || 0), 0);
        if (totalPercentage === 100) {
          item.assignees.forEach(pid => {
            const percentage = item.percentageAssignments?.[pid] || 0;
            const share = (percentage / 100) * itemFinalValue;
            itemShares.set(pid, (itemShares.get(pid) || 0) + share);
          });
        } else {
          fallbackToEqual = true;
        }
      } else if (item.splitMode === 'exact') {
        const totalExact = item.assignees.reduce((sum, pid) => sum + (item.exactAssignments?.[pid] || 0), 0);
        if (totalExact === item.cost && item.cost > 0) {
           item.assignees.forEach(pid => {
            const exactAmount = item.exactAssignments?.[pid] || 0;
            const share = (exactAmount / item.cost) * itemFinalValue;
            itemShares.set(pid, (itemShares.get(pid) || 0) + share);
          });
        } else {
          fallbackToEqual = true;
        }
      }

      if (fallbackToEqual) {
        const sharePerPerson = itemFinalValue / item.assignees.length;
        item.assignees.forEach(pid => {
          itemShares.set(pid, (itemShares.get(pid) || 0) + sharePerPerson);
        });
      }

      // Add item shares to main summaries
      itemShares.forEach((share, pid) => {
        const summary = summaries.get(pid);
        if(summary) {
            summary.totalShare += share;
            const itemServiceProportion = floatReceiptSubtotal > 0 ? (itemCostFloat / floatReceiptSubtotal) : 0;
            const itemServiceChargeShare = itemServiceProportion * integerServiceChargeAmount;
            const personProportionOfItem = itemFinalValue > 0 ? share / itemFinalValue : 0;
            summary.totalServiceChargeShare += itemServiceChargeShare * personProportionOfItem;
        }
      });
    });
  });

  let totalRoundedShare = 0;
  summaries.forEach(summary => {
      const roundedShare = Math.round(summary.totalShare);
      summary.totalShare = roundedShare;
      summary.totalServiceChargeShare = Math.round(summary.totalServiceChargeShare);
      totalRoundedShare += roundedShare;
  });

  const roundingDifference = grandTotal - totalRoundedShare;
  let roundingAdjustment: SplitSummary['roundingAdjustment'] | undefined = undefined;

  if (roundingDifference !== 0) {
    const payers = [...summaries.values()].filter(s => s.totalPaid > 0).sort((a,b) => b.totalPaid - a.totalPaid);
    const personToAdjust = payers[0] || [...summaries.values()][0];

    if (personToAdjust) {
        const summaryToAdjust = summaries.get(personToAdjust.id);
        if(summaryToAdjust){
            summaryToAdjust.totalShare += roundingDifference;
            roundingAdjustment = {
                amount: roundingDifference,
                participantName: summaryToAdjust.name
            };
        }
    }
  }

  summaries.forEach(summary => {
    summary.balance = summary.totalPaid - summary.totalShare;
  });

  const settlements: Settlement[] = [];
  const debtors = [...summaries.values()].filter(s => s.balance < -0.5).map(s => ({ ...s }));
  const creditors = [...summaries.values()].filter(s => s.balance > 0.5).map(s => ({ ...s }));
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      const amount = Math.min(-debtor.balance, creditor.balance);

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
    participantSummaries: Array.from(summaries.values()),
    settlements,
    total: grandTotal,
    totalItemCost,
    totalDiscounts,
    totalServiceCharge,
    roundingAdjustment,
  };
};
