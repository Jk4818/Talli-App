export interface Participant {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  receiptId: string;
  name: string;
  cost: number; // in cents
  isAmbiguous: boolean;
  assignees: string[]; // array of participant IDs
  splitMode: 'equal' | 'percentage' | 'exact';
  percentageAssignments: { [participantId: string]: number }; // participantId -> percentage (e.g. 50 for 50%)
  exactAssignments: { [participantId: string]: number }; // participantId -> amount in cents
}

export interface Discount {
  id: string;
  name: string;
  amount: number; // in cents
}

export interface ServiceCharge {
  type: 'fixed' | 'percentage';
  value: number; // amount in cents or percentage value
}

export interface Receipt {
  id:string;
  name: string;
  payerId: string | null; // participant ID
  discounts: Discount[];
  serviceCharge: ServiceCharge;
  currency: string;
  exchangeRate?: number;
  imageDataUri?: string;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  paid: boolean;
}

export interface ParticipantSummary {
  id: string;
  name: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
}

export interface SplitSummary {
  participantSummaries: ParticipantSummary[];
  settlements: Settlement[];
  total: number;
  totalItemCost: number;
  totalDiscounts: number;
  totalServiceCharge: number;
}

export interface SessionState {
  step: number; // 1, 2, or 3
  participants: Participant[];
  receipts: Receipt[];
  items: Item[];
  settlements: Settlement[];
  globalCurrency: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isDemoSession: boolean;
  currentAssignmentIndex: number;
}
