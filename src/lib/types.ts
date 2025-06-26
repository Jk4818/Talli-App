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
  splitMode: 'equal' | 'percentage';
  percentageAssignments: { [participantId: string]: number }; // participantId -> percentage (e.g. 50 for 50%)
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
}

export interface SessionState {
  step: number; // 1, 2, or 3
  participants: Participant[];
  receipts: Receipt[];
  items: Item[];
  globalCurrency: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentAssignmentIndex: number;
}
