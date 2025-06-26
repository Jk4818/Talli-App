import { createSlice, createAsyncThunk, type PayloadAction, createAction } from '@reduxjs/toolkit';
import type { SessionState, Participant, Receipt, Item, Discount, ServiceCharge, Settlement } from '@/lib/types';
import { MOCK_DATA } from '@/lib/mock-data';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import type { AuthUser } from '@/ai/auth';

const initialState: SessionState = {
  step: 1,
  participants: [],
  receipts: [],
  items: [],
  settlements: [],
  globalCurrency: 'USD',
  status: 'idle',
  error: null,
  isDemoSession: false,
  currentAssignmentIndex: 0,
};

// This thunk now just reads the file and creates a receipt "shell".
export const addReceiptFromFile = createAsyncThunk(
  'session/addReceiptFromFile',
  async (file: File, { rejectWithValue }) => {
    try {
      const imageDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return { name: file.name, imageDataUri };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not read file.');
    }
  }
);


// This thunk now takes a receipt ID, its data URI, and the user to process.
export const processReceipt = createAsyncThunk(
  'session/processReceipt',
  async ({ receiptId, imageDataUri, user }: { receiptId: string; imageDataUri: string; user: AuthUser | null }, { rejectWithValue }) => {
    try {
      const extractedData = await extractReceiptData({ receiptDataUri: imageDataUri, user });
      return { receiptId, ...extractedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI processing.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const loadDemoData = createAction('session/loadDemoData');


const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    restoreSession: (state, action: PayloadAction<Partial<SessionState>>) => {
      const importedData = action.payload;
    
      const sanitizedItems = (importedData.items || []).map((item): Item => ({
        id: `item_${Date.now()}_${Math.random()}`,
        receiptId: '',
        name: 'New Item',
        cost: 0,
        isAmbiguous: false,
        assignees: [],
        splitMode: 'equal',
        percentageAssignments: {},
        exactAssignments: {},
        ...item,
      }));
    
      const sanitizedReceipts = (importedData.receipts || []).map((receipt): Receipt => ({
        id: `receipt_${Date.now()}_${Math.random()}`,
        name: 'New Receipt',
        payerId: null,
        discounts: [],
        serviceCharge: { type: 'fixed', value: 0 },
        currency: 'USD',
        status: 'unprocessed',
        ...receipt,
      }));
    
      return {
        ...initialState,
        ...importedData,
        items: sanitizedItems,
        receipts: sanitizedReceipts,
        participants: importedData.participants || [],
        settlements: [],
        globalCurrency: importedData.globalCurrency || initialState.globalCurrency,
        step: importedData.step || 1,
        status: 'succeeded',
        error: null,
        isDemoSession: false,
      };
    },
    resetSession: () => initialState,
    setStep: (state, action: PayloadAction<number>) => {
      state.step = action.payload;
    },
    addParticipant: (state, action: PayloadAction<string>) => {
      if(action.payload.trim() === '') return;
      const newParticipant: Participant = {
        id: `p_${new Date().getTime()}`,
        name: action.payload,
      };
      state.participants.push(newParticipant);
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(p => p.id !== action.payload);
      state.receipts.forEach(r => {
        if (r.payerId === action.payload) {
          r.payerId = null;
        }
      });
      state.items.forEach(i => {
        i.assignees = i.assignees.filter(id => id !== action.payload);
      });
    },
    updateReceipt: (state, action: PayloadAction<Partial<Receipt> & { id: string }>) => {
      const receipt = state.receipts.find(r => r.id === action.payload.id);
      if (receipt) {
        Object.assign(receipt, action.payload);
      }
    },
    updateServiceCharge: (state, action: PayloadAction<{ receiptId: string, serviceCharge: ServiceCharge }>) => {
      const receipt = state.receipts.find(r => r.id === action.payload.receiptId);
      if (receipt) {
        receipt.serviceCharge = action.payload.serviceCharge;
      }
    },
    addDiscount: (state, action: PayloadAction<{ receiptId: string }>) => {
        const receipt = state.receipts.find(r => r.id === action.payload.receiptId);
        if (receipt) {
            const newDiscount: Discount = {
                id: `d_${receipt.id}_${new Date().getTime()}`,
                name: 'New Discount',
                amount: 0,
            };
            if (!receipt.discounts) {
              receipt.discounts = [];
            }
            receipt.discounts.push(newDiscount);
        }
    },
    updateDiscount: (state, action: PayloadAction<{ receiptId: string, discount: Partial<Discount> & { id: string } }>) => {
        const receipt = state.receipts.find(r => r.id === action.payload.receiptId);
        if (receipt && receipt.discounts) {
            const discount = receipt.discounts.find(d => d.id === action.payload.discount.id);
            if (discount) {
                Object.assign(discount, action.payload.discount);
            }
        }
    },
    removeDiscount: (state, action: PayloadAction<{ receiptId: string, discountId: string }>) => {
        const receipt = state.receipts.find(r => r.id === action.payload.receiptId);
        if (receipt && receipt.discounts) {
            receipt.discounts = receipt.discounts.filter(d => d.id !== action.payload.discountId);
        }
    },
    addItem: (state, action: PayloadAction<{ receiptId: string }>) => {
      const newItem: Item = {
        id: `item_${new Date().getTime()}`,
        receiptId: action.payload.receiptId,
        name: 'New Item',
        cost: 0,
        isAmbiguous: false,
        assignees: [],
        splitMode: 'equal',
        percentageAssignments: {},
        exactAssignments: {},
      };
      state.items.push(newItem);
    },
    updateItem: (state, action: PayloadAction<Partial<Item> & { id: string }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        Object.assign(item, action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    assignItemToUser: (state, action: PayloadAction<{ itemId: string; participantId: string }>) => {
        const item = state.items.find(i => i.id === action.payload.itemId);
        if (item && !item.assignees.includes(action.payload.participantId)) {
            item.assignees.push(action.payload.participantId);
            if (item.splitMode === 'percentage') {
              item.percentageAssignments = {};
            }
            if (item.splitMode === 'exact') {
              if(!item.exactAssignments) {
                item.exactAssignments = {};
              }
            }
        }
    },
    unassignItemFromUser: (state, action: PayloadAction<{ itemId: string; participantId: string }>) => {
        const item = state.items.find(i => i.id === action.payload.itemId);
        if (item) {
            const participantId = action.payload.participantId;
            item.assignees = item.assignees.filter(id => id !== participantId);
            
            if (item.splitMode === 'percentage' && item.percentageAssignments) {
                item.percentageAssignments = {};
            }
            if (item.splitMode === 'exact' && item.exactAssignments) {
              delete item.exactAssignments[participantId];
            }
        }
    },
    toggleAllAssignees: (state, action: PayloadAction<{ itemId: string; assignAll: boolean }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        if (action.payload.assignAll) {
          item.assignees = state.participants.map(p => p.id);
        } else {
          item.assignees = [];
        }
        if (item.splitMode === 'percentage') {
          item.percentageAssignments = {};
        }
        if (item.splitMode === 'exact') {
          item.exactAssignments = {};
        }
      }
    },
    setGlobalCurrency: (state, action: PayloadAction<string>) => {
      state.globalCurrency = action.payload;
    },
    setItemSplitMode: (state, action: PayloadAction<{ itemId: string; splitMode: 'equal' | 'percentage' | 'exact' }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        item.splitMode = action.payload.splitMode;
        item.percentageAssignments = {};
        item.exactAssignments = {};
      }
    },
    setPercentageAssignment: (state, action: PayloadAction<{ itemId: string; participantId: string; percentage: number }>) => {
        const item = state.items.find(i => i.id === action.payload.itemId);
        if (item && item.splitMode === 'percentage') {
            item.percentageAssignments[action.payload.participantId] = action.payload.percentage;
        }
    },
    setExactAssignment: (state, action: PayloadAction<{ itemId: string; participantId: string; amount: number }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item && item.splitMode === 'exact') {
          if(!item.exactAssignments) {
            item.exactAssignments = {};
          }
          item.exactAssignments[action.payload.participantId] = action.payload.amount;
      }
    },
    setCurrentAssignmentIndex: (state, action: PayloadAction<number>) => {
      state.currentAssignmentIndex = action.payload;
    },
    setSettlements: (state, action: PayloadAction<Settlement[]>) => {
      const newSettlements = action.payload;
      const existingSettlementsById = new Map(state.settlements.map(s => [s.id, s]));
      
      const mergedSettlements = newSettlements.map(newS => {
        const existingS = existingSettlementsById.get(newS.id);
        return existingS ? { ...newS, paid: existingS.paid } : newS;
      });

      state.settlements = mergedSettlements;
    },
    toggleSettlementPaid: (state, action: PayloadAction<{ settlementId: string }>) => {
      const settlement = state.settlements.find(s => s.id === action.payload.settlementId);
      if (settlement) {
          settlement.paid = !settlement.paid;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDemoData, (state) => {
        const demoState = { ...MOCK_DATA, status: 'succeeded' as const, error: null, isDemoSession: true };
        const processedDemoReceipts = demoState.receipts.map(r => ({...r, status: 'processed' as const}));
        return { ...initialState, ...demoState, receipts: processedDemoReceipts, settlements: [] };
      })
      .addCase(addReceiptFromFile.fulfilled, (state, action) => {
        const newReceipt: Receipt = {
          id: `receipt_${new Date().getTime()}`,
          name: action.payload.name,
          imageDataUri: action.payload.imageDataUri,
          status: 'unprocessed',
          payerId: null,
          discounts: [],
          serviceCharge: { type: 'fixed', value: 0 },
          currency: state.globalCurrency,
        };
        state.receipts.push(newReceipt);
      })
      .addCase(processReceipt.pending, (state, action) => {
        const receipt = state.receipts.find(r => r.id === action.meta.arg.receiptId);
        if (receipt) {
          receipt.status = 'processing';
          state.error = null;
        }
      })
      .addCase(processReceipt.fulfilled, (state, action) => {
        const { receiptId } = action.payload;
        const receipt = state.receipts.find(r => r.id === receiptId);
        if (receipt) {
          // Remove any existing items associated with this receipt before adding new ones
          state.items = state.items.filter(item => item.receiptId !== receiptId);

          const serviceChargeTotal = action.payload.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0);
          
          receipt.discounts = action.payload.discounts.map((d, i) => ({...d, id: `d_${receiptId}_${i}`, amount: Math.round(d.amount * 100)}));
          receipt.serviceCharge = { type: 'fixed', value: Math.round(serviceChargeTotal * 100) };
          receipt.currency = action.payload.currency || state.globalCurrency;
          receipt.status = 'processed';

          const newItems: Item[] = action.payload.items.map((item, index) => ({
            id: `item_${receiptId}_${index}`,
            receiptId: receiptId,
            name: item.name,
            cost: Math.round(item.cost * 100),
            isAmbiguous: item.isAmbiguous,
            assignees: [],
            splitMode: 'equal',
            percentageAssignments: {},
            exactAssignments: {},
          }));

          state.items.push(...newItems);
        }
      })
      .addCase(processReceipt.rejected, (state, action) => {
        const receipt = state.receipts.find(r => r.id === action.meta.arg.receiptId);
        if (receipt) {
          receipt.status = 'failed';
        }
        state.error = action.payload as string;
      });
  }
});

export const {
  restoreSession,
  resetSession,
  setStep,
  addParticipant,
  removeParticipant,
  updateReceipt,
  updateServiceCharge,
  addDiscount,
  updateDiscount,
  removeDiscount,
  addItem,
  updateItem,
  removeItem,
  assignItemToUser,
  unassignItemFromUser,
  toggleAllAssignees,
  setGlobalCurrency,
  setItemSplitMode,
  setPercentageAssignment,
  setExactAssignment,
  setCurrentAssignmentIndex,
  setSettlements,
  toggleSettlementPaid,
} = sessionSlice.actions;

export default sessionSlice.reducer;
