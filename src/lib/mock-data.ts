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
      discounts: [{ id: 'd_1', name: '20% Off Mains', amount: 1160 }],
      serviceCharge: { type: 'percentage', value: 12.5 },
    },
    {
      id: 'r_2',
      name: 'Drinks at The Salty Dog',
      payerId: 'p_2',
      currency: 'GBP',
      discounts: [],
      serviceCharge: { type: 'fixed', value: 0 },
    },
  ],
  items: [
    // Receipt 1 Items
    { id: 'i_1', receiptId: 'r_1', name: 'Steak Frites', cost: 2500, isAmbiguous: false, assignees: ['p_1', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_2', receiptId: 'r_1', name: 'Truffle Pasta', cost: 2200, isAmbiguous: false, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_3', receiptId: 'r_1', name: 'Bottle of Merlot', cost: 3000, isAmbiguous: false, assignees: ['p_1', 'p_2', 'p_3', 'p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_4', receiptId: 'r_1', name: 'Side Salad', cost: 600, isAmbiguous: false, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_5', receiptId: 'r_1', name: 'Sparkling Water', cost: 400, isAmbiguous: false, assignees: ['p_1', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_6', receiptId: 'r_1', name: 'Cheeseboard', cost: 1200, isAmbiguous: true, assignees: ['p_1', 'p_4'], splitMode: 'percentage', percentageAssignments: { 'p_1': 70, 'p_4': 30 }, exactAssignments: {} },
    
    // Receipt 2 Items
    { id: 'i_7', receiptId: 'r_2', name: 'Pint of Lager', cost: 550, isAmbiguous: false, assignees: ['p_1'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_8', receiptId: 'r_2', name: 'Pint of Lager', cost: 550, isAmbiguous: false, assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_9', receiptId: 'r_2', name: 'Gin & Tonic', cost: 800, isAmbiguous: false, assignees: ['p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_10', receiptId: 'r_2', name: 'Glass of Sauvignon', cost: 750, isAmbiguous: false, assignees: ['p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_11', receiptId: 'r_2', name: 'Scotch Egg', cost: 450, isAmbiguous: false, assignees: ['p_1', 'p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {} },
    { id: 'i_12', receiptId: 'r_2', name: 'Round of Shots', cost: 1500, isAmbiguous: false, assignees: ['p_3', 'p_4'], splitMode: 'exact', percentageAssignments: {}, exactAssignments: { 'p_3': 1000, 'p_4': 500 } },
  ],
  settlements: [],
  currentAssignmentIndex: 0,
};
