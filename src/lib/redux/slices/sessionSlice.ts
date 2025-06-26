import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, Participant, Receipt, Item, Discount, ServiceCharge, Settlement } from '@/lib/types';
import { MOCK_DATA } from '@/lib/mock-data';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';

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

export const processReceipt = createAsyncThunk(
  'session/processReceipt',
  async (file: File, { rejectWithValue }) => {
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const extractedData = await extractReceiptData({ receiptDataUri: dataUri });

      return { ...extractedData, fileName: file.name, imageDataUri: dataUri };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred during AI processing.');
    }
  }
);


const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    loadDemoData: (state) => {
      const demoState = { ...MOCK_DATA, status: 'succeeded', error: null, isDemoSession: true };
      return { ...initialState, ...demoState, settlements: [] }; // Reset settlements for demo
    },
    restoreSession: (state, action: PayloadAction<Partial<SessionState>>) => {
      const importedData = action.payload;
    
      // Provide default values for every item to ensure backward compatibility.
      const sanitizedItems = (importedData.items || []).map((item): Item => ({
        id: `item_${Date.now()}_${Math.random()}`, // fallback id
        receiptId: '',
        name: 'New Item',
        cost: 0,
        isAmbiguous: false,
        assignees: [],
        splitMode: 'equal',
        percentageAssignments: {},
        exactAssignments: {},
        ...item, // Overwrite defaults with imported values
      }));
    
      // Provide default values for every receipt.
      const sanitizedReceipts = (importedData.receipts || []).map((receipt): Receipt => ({
        id: `receipt_${Date.now()}_${Math.random()}`, // fallback id
        name: 'New Receipt',
        payerId: null,
        discounts: [],
        serviceCharge: { type: 'fixed', value: 0 },
        currency: 'USD',
        ...receipt, // Overwrite defaults with imported values
      }));
    
      // Merge the sanitized data with the initial state to cover top-level fields.
      return {
        ...initialState,
        ...importedData,
        items: sanitizedItems,
        receipts: sanitizedReceipts,
        participants: importedData.participants || [],
        settlements: [], // Always start with fresh settlements on import
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
            // For percentage mode, it's better to reset because the total needs to be 100%.
            if (item.splitMode === 'percentage') {
              item.percentageAssignments = {};
            }
            // For exact mode, we just add the user. Their value will be 0 by default.
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
            
            // Also reset percentages when a user is removed
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
        // Reset assignments when changing mode to avoid carrying over invalid data
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
        // Preserve existing `paid` status if the settlement still exists
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
      .addCase(processReceipt.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(processReceipt.fulfilled, (state, action) => {
        const receiptId = `receipt_${new Date().getTime()}`;
        
        const serviceChargeTotal = action.payload.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0);

        const newReceipt: Receipt = {
          id: receiptId,
          name: action.payload.fileName,
          payerId: null,
          discounts: action.payload.discounts.map((d, i) => ({...d, id: `d_${receiptId}_${i}`, amount: Math.round(d.amount * 100)})),
          serviceCharge: { type: 'fixed', value: Math.round(serviceChargeTotal * 100) },
          currency: action.payload.currency || state.globalCurrency,
          imageDataUri: action.payload.imageDataUri,
        };
        
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

        state.receipts.push(newReceipt);
        state.items.push(...newItems);
        state.status = 'succeeded';
      })
      .addCase(processReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  }
});

export const {
  loadDemoData,
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
