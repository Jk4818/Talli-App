export interface Participant {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  receiptId: string;
  name: string;
  quantity: number; // The number of units for this line item
  unitCost?: number; // The cost of a single unit, in cents
  cost: number; // in cents, represents the original, pre-discount cost for all units (quantity * unitCost)
  discounts: Discount[]; // Item-specific discounts
  assignees: string[]; // array of participant IDs
  splitMode: 'equal' | 'percentage' | 'exact';
  percentageAssignments: { [participantId: string]: number }; // participantId -> percentage (e.g. 50 for 50%)
  exactAssignments: { [participantId: string]: number }; // participantId -> amount in cents
  confidence?: number; // 0-100
  category?: 'Food' | 'Drink' | 'Other';
  subCategory?: string;
}

export interface Discount {
  id: string;
  name: string;
  amount: number; // in cents
  confidence?: number; // 0-100
  suggestedItemId?: string | null; // The ID of the item this discount is suggested for
}

export interface ServiceCharge {
  type: 'fixed' | 'percentage';
  value: number; // amount in cents or percentage value
  confidence?: number; // 0-100
}

export interface Receipt {
  id:string;
  name: string;
  payerId: string | null; // participant ID
  discounts: Discount[]; // Receipt-wide discounts
  serviceCharge: ServiceCharge;
  currency: string;
  exchangeRate?: number;
  imageDataUri?: string;
  status: 'unprocessed' | 'processing' | 'processed' | 'failed';
  error?: string | null;
  overallConfidence?: number; // 0-100
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  paid: boolean;
}

export interface BreakdownEntry {
  itemId?: string;
  description: string;
  amount: number; // in cents, negative for discounts
  receiptId: string;
  isDiscount?: boolean;
}

export interface ParticipantSummary {
  id: string;
  name: string;
  totalPaid: number;
  totalShare: number;
  totalServiceChargeShare: number;
  balance: number;
  breakdown: {
    items: BreakdownEntry[];
    discounts: BreakdownEntry[];
    serviceCharges: BreakdownEntry[];
  };
}

export interface SplitSummary {
  participantSummaries: ParticipantSummary[];
  settlements: Settlement[];
  total: number;
  totalItemCost: number;
  totalDiscounts: number;
  totalServiceCharge: number;
  roundingAdjustment?: {
    amount: number; // in cents
    participantName: string;
  };
  roundingOccurred: boolean;
  roundedItems: {
    name: string;
    cost: number;
    assigneesCount: number;
    adjustments: {
        participantName: string;
        amount: number; // in cents, e.g. +1 or -1
    }[];
  }[];
  discountRounding?: {
    receiptName: string;
    description: string;
    totalAmount: number;
    adjustments: {
      participantName: string;
      amount: number;
    }[];
  }[];
  serviceChargeRounding?: {
    receiptName: string;
    description: string;
    totalAmount: number;
    adjustments: {
      participantName: string;
      amount: number;
    }[];
  }[];
}

export interface SessionState {
  step: number; // 1, 2, or 3
  participants: Participant[];
  receipts: Receipt[];
  items: Item[];
  paidSettlements: Record<string, boolean>;
  globalCurrency: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isDemoSession: boolean;
  currentAssignmentIndex: number;
}
