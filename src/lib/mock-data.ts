
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
      discounts: [
        { id: 'd_1', name: '20% Off Mains', amount: 1160, confidence: 95 },
        { id: 'd_2', name: 'Pasta Special', amount: 500, confidence: 92, suggestedItemId: 'i_2' }
      ],
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
    { id: 'i_1', receiptId: 'r_1', name: 'Steak Frites', quantity: 2, unitCost: 1250, cost: 2500, discounts: [], assignees: ['p_1', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 98, category: 'Food', subCategory: 'Main' },
    { id: 'i_2', receiptId: 'r_1', name: 'Truffle Pasta', quantity: 1, cost: 2200, discounts: [], assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 99, category: 'Food', subCategory: 'Pasta' },
    { id: 'i_3', receiptId: 'r_1', name: 'Bottle of Merlot', quantity: 1, cost: 3000, discounts: [], assignees: ['p_1', 'p_2', 'p_3', 'p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 92, category: 'Drink', subCategory: 'Wine' },
    { id: 'i_4', receiptId: 'r_1', name: 'Side Salad', quantity: 1, cost: 600, discounts: [], assignees: ['p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 85, category: 'Food', subCategory: 'Side' },
    { id: 'i_5', receiptId: 'r_1', name: 'Sparkling Water', quantity: 1, cost: 401, discounts: [], assignees: ['p_1', 'p_2', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 96, category: 'Drink', subCategory: 'Soft Drink' },
    { id: 'i_6', receiptId: 'r_1', name: 'Cheeseboard', quantity: 1, cost: 1200, discounts: [], assignees: ['p_1', 'p_4'], splitMode: 'percentage', percentageAssignments: { 'p_1': 70, 'p_4': 30 }, exactAssignments: {}, confidence: 90, category: 'Food', subCategory: 'Dessert' },
    { id: 'i_13', receiptId: 'r_1', name: 'Crème Brûlée (Discounted)', quantity: 1, cost: 800, discounts: [{ id: 'd_item_1', name: 'Dessert Deal', amount: 150 }], assignees: ['p_1', 'p_2', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 99, category: 'Food', subCategory: 'Dessert' },

    // Receipt 2 Items
    { id: 'i_7', receiptId: 'r_2', name: 'Pint of Lager', quantity: 2, unitCost: 275, cost: 550, discounts: [], assignees: ['p_1', 'p_2', 'p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 97, category: 'Drink', subCategory: 'Beer' },
    { id: 'i_8', receiptId: 'r_2', name: 'Pint of Lager', quantity: 1, cost: 550, discounts: [], assignees: ['p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 97, category: 'Drink', subCategory: 'Beer' },
    { id: 'i_9', receiptId: 'r_2', name: 'Gin & Tonic', quantity: 1, cost: 800, discounts: [], assignees: ['p_3'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 95, category: 'Drink', subCategory: 'Cocktail' },
    { id: 'i_10', receiptId: 'r_2', name: 'Glass of Sauvignon', quantity: 1, cost: 750, discounts: [], assignees: ['p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 93, category: 'Drink', subCategory: 'Wine' },
    { id: 'i_11', receiptId: 'r_2', name: 'Scotch Egg', quantity: 1, cost: 450, discounts: [], assignees: ['p_1', 'p_2'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 88, category: 'Food', subCategory: 'Snack' },
    { id: 'i_12', receiptId: 'r_2', name: 'Round of Shots', quantity: 1, cost: 1501, discounts: [], assignees: ['p_1', 'p_2', 'p_3', 'p_4'], splitMode: 'equal', percentageAssignments: {}, exactAssignments: {}, confidence: 82, category: 'Drink', subCategory: 'Spirits' },
  ],
  paidSettlements: {},
  currentAssignmentIndex: 0,
};
