import type { SessionState } from './types';

export const MOCK_DATA: SessionState = {
  step: 1,
  status: 'idle',
  error: null,
  globalCurrency: 'GBP',
  isDemoSession: true,
  participants: [
    { id: 'p_1', name: 'Alice' },
    { id: 'p_2', name: 'Bob' },
    { id: 'p_3', name: 'Charlie' },
    { id: 'p_4', name: 'David' },
  ],
  receipts: [
    {
      id: 'r_1',
      name: 'Dinner at The Grand Bistro',
      payerId: 'p_1',
      currency: 'GBP',
      discounts: [{ id: 'd_1', name: '20% Off Mains', amount: 1160, confidence: 95 }],
      serviceCharge: { type: 'percentage', value: 12.5, confidence: 98 },
      status: 'processed',
      overallConfidence: 94,
    },
    {
      id: 'r_2',
      name: 'Drinks at The Salty Dog',
      payerId: 'p_2',
      currency: 'GBP',
      discounts: [],
      serviceCharge: { type: 'fixed', value: 0, confidence: 99 },
      status: 'processed',
      overallConfidence: 91,
    },
  ],
  items: [
    // Receipt 1 Items
    { id: 'i_1', receiptId: 'r_1', name: 'Steak Frites', cost: 2500, assignees: ['p_1', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 98 },
    { id: 'i_2', receiptId: 'r_1', name: 'Truffle Pasta', cost: 2200, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 99 },
    { id: 'i_3', receiptId: 'r_1', name: 'Bottle of Merlot', cost: 3000, assignees: ['p_1', 'p_2', 'p_3', 'p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 92 },
    { id: 'i_4', receiptId: 'r_1', name: 'Side Salad', cost: 600, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 85 },
    { id: 'i_5', receiptId: 'r_1', name: 'Sparkling Water', cost: 400, assignees: ['p_1', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 96 },
    { id: 'i_6', receiptId: 'r_1', name: 'Cheeseboard', cost: 1200, assignees: ['p_1', 'p_4'], splitMode: 'percentage', percentageAssignments: { 'p_1': 70, 'p_4': 30 }, exactAssignments: {}, confidence: 90 },
    
    // Receipt 2 Items
    { id: 'i_7', receiptId: 'r_2', name: 'Pint of Lager', cost: 550, assignees: ['p_1'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 97 },
    { id: 'i_8', receiptId: 'r_2', name: 'Pint of Lager', cost: 550, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 97 },
    { id: 'i_9', receiptId: 'r_2', name: 'Gin & Tonic', cost: 800, assignees: ['p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 95 },
    { id: 'i_10', receiptId: 'r_2', name: 'Glass of Sauvignon', cost: 750, assignees: ['p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 93 },
    { id: 'i_11', receiptId: 'r_2', name: 'Scotch Egg', cost: 450, assignees: ['p_1', 'p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 88 },
    { id: 'i_12', receiptId: 'r_2', name: 'Round of Shots', cost: 1500, assignees: ['p_3', 'p_4'], splitMode: 'exact', percentageAssignments: {}, exactAssignments: { 'p_3': 1000, 'p_4': 500 }, confidence: 82 },
  ],
  paidSettlements: {},
  currentAssignmentIndex: 0,
};
