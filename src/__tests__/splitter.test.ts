
import { calculateSplits } from '../lib/splitter';
import { SessionState, Participant, Item, Receipt } from '../lib/types';

describe('calculateSplits', () => {
  // =================================================================
  // == BASE DATA
  // =================================================================
  const two_participants: Participant[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  const three_participants: Participant[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
  ];

  const base_receipt: Receipt = {
      id: 'r1',
      name: 'Test Receipt',
      payerId: 'p1',
      currency: 'USD',
      discounts: [],
      serviceCharge: { type: 'fixed', value: 0 },
      status: 'processed',
  };

  // =================================================================
  // == BASIC SPLITS
  // =================================================================

  test('should split an item equally between two people', () => {
    const items: Item[] = [
      {
        id: 'i1', receiptId: 'r1', name: 'Pizza', quantity: 1, cost: 2000,
        assignees: ['p1', 'p2'], splitMode: 'equal', discounts: [],
        percentageAssignments: {}, exactAssignments: {}, category: 'Food',
      },
    ];

    const sessionState: SessionState = {
      step: 3, participants: two_participants, receipts: [base_receipt], items,
      paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
      isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);

    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(1000);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(1000);
    expect(result.settlements[0].from).toBe('Bob');
    expect(result.settlements[0].to).toBe('Alice');
    expect(result.settlements[0].amount).toBe(1000);
  });

  test('should handle equal split rounding (the "un-splittable penny")', () => {
    const items: Item[] = [
      {
        id: 'i1', receiptId: 'r1', name: 'Shared Appetizer', quantity: 1, cost: 1000,
        assignees: ['p1', 'p2', 'p3'], splitMode: 'equal', discounts: [],
        percentageAssignments: {}, exactAssignments: {}, category: 'Food',
      },
    ];

    const sessionState: SessionState = {
      step: 3, participants: three_participants, receipts: [base_receipt], items,
      paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
      isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    const shares = result.participantSummaries.map(p => p.totalShare);
    
    // Total should still be correct
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000); 
    // Check for deterministic rounding distribution (sorted by participant ID)
    // Alice (p1), Bob (p2), Charlie (p3)
    // Alice should get the extra penny
    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(334);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(333);
    expect(result.participantSummaries.find(p => p.id === 'p3')?.totalShare).toBe(333);
  });

  test('should handle percentage splits correctly', () => {
    const items: Item[] = [
        {
            id: 'i1', receiptId: 'r1', name: 'Shared Platter', quantity: 1, cost: 3000,
            assignees: ['p1', 'p2'], splitMode: 'percentage', discounts: [],
            percentageAssignments: { p1: 70, p2: 30 }, exactAssignments: {}, category: 'Food',
        },
    ];

    const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts: [base_receipt], items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(2100);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(900);
  });

  test('should handle exact amount splits correctly', () => {
    const items: Item[] = [
        {
            id: 'i1', receiptId: 'r1', name: 'Wine Bottle', quantity: 1, cost: 2500,
            assignees: ['p1', 'p2'], splitMode: 'exact', discounts: [],
            percentageAssignments: {}, exactAssignments: { p1: 1000, p2: 1500 }, category: 'Drink',
        },
    ];
    
    const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts: [base_receipt], items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(1000);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(1500);
  });

  // =================================================================
  // == DISCOUNTS AND SERVICE CHARGES
  // =================================================================

  test('should apply an item-level discount before splitting', () => {
    const items: Item[] = [
      {
        id: 'i1', receiptId: 'r1', name: 'Pizza', quantity: 1, cost: 2000,
        discounts: [{ id: 'd_item_1', name: '5 off', amount: 500 }],
        assignees: ['p1', 'p2'], splitMode: 'equal',
        percentageAssignments: {}, exactAssignments: {}, category: 'Food',
      },
    ];

    const sessionState: SessionState = {
      step: 3, participants: two_participants, receipts: [base_receipt], items,
      paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
      isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    // (2000 - 500) / 2 = 750
    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(750);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(750);
    expect(result.total).toBe(1500);
  });

  test('should apply a receipt-wide discount proportionally', () => {
    const receipt_with_discount: Receipt = {
        ...base_receipt,
        discounts: [{ id: 'd_receipt_1', name: '10% off', amount: 300 }], // 10% of 3000
    };
    const items: Item[] = [
      { id: 'i1', receiptId: 'r1', name: 'Steak', quantity: 1, cost: 2000, assignees: ['p1'], splitMode: 'equal', discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food' },
      { id: 'i2', receiptId: 'r1', name: 'Salad', quantity: 1, cost: 1000, assignees: ['p2'], splitMode: 'equal', discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food' },
    ];
    const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts: [receipt_with_discount], items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };
    
    const result = calculateSplits(sessionState);
    const alice = result.participantSummaries.find(p => p.id === 'p1')!;
    const bob = result.participantSummaries.find(p => p.id === 'p2')!;

    // Alice's gross share is 2000 (2/3 of total). Bob's is 1000 (1/3 of total).
    // Alice gets 2/3 of discount (200). Bob gets 1/3 (100).
    // Alice's final share: 2000 - 200 = 1800
    // Bob's final share: 1000 - 100 = 900
    expect(alice.totalShare).toBe(1800);
    expect(bob.totalShare).toBe(900);
    expect(result.total).toBe(2700); // 3000 - 300
  });

  test('should apply a percentage-based service charge', () => {
      const receipt_with_tip: Receipt = {
          ...base_receipt,
          serviceCharge: { type: 'percentage', value: 20 }, // 20%
      };
      const items: Item[] = [
        { id: 'i1', receiptId: 'r1', name: 'Item A', cost: 1000, assignees: ['p1'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Other'},
        { id: 'i2', receiptId: 'r1', name: 'Item B', cost: 3000, assignees: ['p1', 'p2'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Other'},
      ];
      const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts: [receipt_with_tip], items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
      };

      const result = calculateSplits(sessionState);
      const alice = result.participantSummaries.find(p => p.id === 'p1')!;
      const bob = result.participantSummaries.find(p => p.id === 'p2')!;
      
      // Total cost = 4000. Service charge = 20% of 4000 = 800. Grand total = 4800.
      // Alice's gross share: 1000 + 1500 = 2500 (5/8 of total)
      // Bob's gross share: 1500 (3/8 of total)
      // Alice's tip share: 5/8 of 800 = 500
      // Bob's tip share: 3/8 of 800 = 300
      // Alice's total share: 2500 + 500 = 3000
      // Bob's total share: 1500 + 300 = 1800
      expect(alice.totalShare).toBe(3000);
      expect(bob.totalShare).toBe(1800);
      expect(result.total).toBe(4800);
  });

  // =================================================================
  // == COMPLEX SCENARIOS
  // =================================================================

  test('should handle multiple receipts with different payers', () => {
    const receipts: Receipt[] = [
      { ...base_receipt, id: 'r1', name: 'Dinner', payerId: 'p1'},
      { ...base_receipt, id: 'r2', name: 'Drinks', payerId: 'p2'},
    ];
    const items: Item[] = [
      { id: 'i1', receiptId: 'r1', name: 'Steak', cost: 3000, assignees: ['p1'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food'},
      { id: 'i2', receiptId: 'r2', name: 'Cocktail', cost: 1500, assignees: ['p2'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Drink'},
    ];
    const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts, items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    const alice = result.participantSummaries.find(p => p.id === 'p1')!;
    const bob = result.participantSummaries.find(p => p.id === 'p2')!;

    // Alice paid 3000 for her own steak. Bob paid 1500 for his own cocktail.
    expect(alice.totalPaid).toBe(3000);
    expect(alice.totalShare).toBe(3000);
    expect(alice.balance).toBe(0);

    expect(bob.totalPaid).toBe(1500);
    expect(bob.totalShare).toBe(1500);
    expect(bob.balance).toBe(0);

    expect(result.settlements.length).toBe(0); // All settled up
  });

  test('should handle multiple currencies with an exchange rate', () => {
    const receipts: Receipt[] = [
        { id: 'r1', name: 'US Meal', payerId: 'p1', currency: 'USD', discounts:[], serviceCharge:{ type: 'fixed', value: 0 }, status: 'processed'},
        { id: 'r2', name: 'UK Meal', payerId: 'p2', currency: 'GBP', exchangeRate: 1.25, discounts:[], serviceCharge:{ type: 'fixed', value: 0 }, status: 'processed' }, // 1 GBP = 1.25 USD
    ];
    const items: Item[] = [
        { id: 'i1', receiptId: 'r1', name: 'Burger', cost: 1000, assignees: ['p1', 'p2'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food'}, // $10
        { id: 'i2', receiptId: 'r2', name: 'Fish & Chips', cost: 800, assignees: ['p1', 'p2'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food'}, // £8
    ];
     const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts, items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);
    const alice = result.participantSummaries.find(p => p.id === 'p1')!;
    const bob = result.participantSummaries.find(p => p.id === 'p2')!;

    // Alice paid $10. Bob paid £8, which is $10 (8 * 1.25).
    expect(alice.totalPaid).toBe(1000);
    expect(bob.totalPaid).toBe(1000);

    // Total bill is $10 + $10 = $20. Each person's share is $10.
    expect(alice.totalShare).toBe(1000);
    expect(bob.totalShare).toBe(1000);

    expect(alice.balance).toBe(0);
    expect(bob.balance).toBe(0);
    expect(result.settlements.length).toBe(0);
  });

  test('should handle a complex scenario with multiple items, discounts, and service charge', () => {
    const complexParticipants: Participant[] = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Charlie' },
    ];
    
    const complexReceipts: Receipt[] = [
        {
          id: 'r1', name: 'Dinner', payerId: 'p1', currency: 'USD',
          discounts: [{ id: 'd1', name: '10% off', amount: 450, suggestedItemId: null }], // 10% of (2000 + 2500)
          serviceCharge: { type: 'percentage', value: 15 }, // 15% tip
          status: 'processed',
        },
    ];

    const complexItems: Item[] = [
        { id: 'i1', receiptId: 'r1', name: 'Steak', quantity: 1, cost: 2000, assignees: ['p1'], splitMode: 'equal', discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food' },
        { id: 'i2', receiptId: 'r1', name: 'Wine', quantity: 1, cost: 2500, assignees: ['p1', 'p2', 'p3'], splitMode: 'equal', discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food' },
    ];

    const sessionState: SessionState = {
      step: 3, participants: complexParticipants, receipts: complexReceipts, items: complexItems,
      paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
      isDemoSession: false, currentAssignmentIndex: 0,
    };

    const result = calculateSplits(sessionState);

    const alice = result.participantSummaries.find(p => p.name === 'Alice')!;
    const bob = result.participantSummaries.find(p => p.name === 'Bob')!;
    const charlie = result.participantSummaries.find(p => p.name === 'Charlie')!;

    // VERIFIED VALUES FROM CODE EXECUTION:
    // This test ensures that the deterministic rounding logic for item-level shares,
    // receipt-level discounts, and service charges, plus the final session-wide
    // rounding adjustment, all work together correctly.

    // Final total is 4658.
    // Alice's final share is 2932
    // Bob's final share is 863
    // Charlie's final share is 863
    // The individual calculated shares (2932+863+863) sum to 4658.
    
    expect(alice.totalShare).toBe(2932);
    expect(bob.totalShare).toBe(863);
    expect(charlie.totalShare).toBe(863);
    
    const totalShare = alice.totalShare + bob.totalShare + charlie.totalShare;
    const totalPaid = result.total;
    expect(totalShare).toBe(totalPaid);
    expect(totalPaid).toBe(4658);
  });


  // =================================================================
  // == EDGE CASES
  // =================================================================

  test('should handle zero-cost items gracefully', () => {
    const items: Item[] = [
      { id: 'i1', receiptId: 'r1', name: 'Free Appetizer', cost: 0, assignees: ['p1', 'p2'], splitMode: 'equal', quantity: 1, discounts:[], percentageAssignments:{}, exactAssignments:{}, category: 'Food'},
    ];
     const sessionState: SessionState = {
        step: 3, participants: two_participants, receipts: [base_receipt], items,
        paidSettlements: {}, globalCurrency: 'USD', status: 'idle', error: null,
        isDemoSession: false, currentAssignmentIndex: 0,
    };
    const result = calculateSplits(sessionState);
    expect(result.participantSummaries.find(p => p.id === 'p1')?.totalShare).toBe(0);
    expect(result.participantSummaries.find(p => p.id === 'p2')?.totalShare).toBe(0);
    expect(result.total).toBe(0);
  });
});
