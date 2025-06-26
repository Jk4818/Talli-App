import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, Participant, Receipt, Item, Discount, ServiceCharge, Settlement } from '@/lib/types';
import { MOCK_DATA } from '@/lib/mock-data';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { flagAmbiguousItems } from '@/ai/flows/flag-ambiguous-items';

const initialState: SessionState = {
  step: 1,
  participants: [],
  receipts: [],
  items: [],
  settlements: [],
  globalCurrency: 'USD',
  status: 'idle',
  error: null,
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
      
      const itemsToFlag = extractedData.items.map(item => ({ name: item.name, cost: item.cost }));
      const flaggedItems = itemsToFlag.length > 0 ? await flagAmbiguousItems(itemsToFlag) : [];
      
      const itemsWithFlags = extractedData.items.map(item => {
        const flaggedVersion = flaggedItems.find(f => f.name === item.name && f.cost === item.cost);
        return { ...item, isAmbiguous: flaggedVersion?.isAmbiguous ?? false };
      });

      return { ...extractedData, fileName: file.name, items: itemsWithFlags };
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
      const demoState = { ...MOCK_DATA, status: 'succeeded', error: null };
      return { ...initialState, ...demoState, settlements: [] }; // Reset settlements for demo
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
            if(item.splitMode === 'percentage') {
              item.percentageAssignments = {};
            }
        }
    },
    unassignItemFromUser: (state, action: PayloadAction<{ itemId: string; participantId: string }>) => {
        const item = state.items.find(i => i.id === action.payload.itemId);
        if (item) {
            item.assignees = item.assignees.filter(id => id !== action.payload.participantId);
            if(item.splitMode === 'percentage') {
              delete item.percentageAssignments[action.payload.participantId];
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
        if(item.splitMode === 'percentage') {
          item.percentageAssignments = {};
        }
      }
    },
    setGlobalCurrency: (state, action: PayloadAction<string>) => {
      state.globalCurrency = action.payload;
    },
    setItemSplitMode: (state, action: PayloadAction<{ itemId: string; splitMode: 'equal' | 'percentage' }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        item.splitMode = action.payload.splitMode;
        item.percentageAssignments = {};
      }
    },
    setPercentageAssignment: (state, action: PayloadAction<{ itemId: string; participantId: string; percentage: number }>) => {
        const item = state.items.find(i => i.id === action.payload.itemId);
        if (item && item.splitMode === 'percentage') {
            item.percentageAssignments[action.payload.participantId] = action.payload.percentage;
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
        const newReceipt: Receipt = {
          id: receiptId,
          name: action.payload.fileName,
          payerId: null,
          discounts: action.payload.discounts.map((d, i) => ({...d, id: `d_${receiptId}_${i}`, amount: Math.round(d.amount * 100)})),
          serviceCharge: { type: 'fixed', value: 0 },
          currency: action.payload.currency || state.globalCurrency,
        };
        
        const newItems: Item[] = action.payload.items.map((item, index) => ({
          id: `item_${receiptId}_${index}`,
          receiptId: receiptId,
          name: item.name,
          cost: Math.round(item.cost * 100),
          isAmbiguous: item.isAmbiguous ?? false,
          assignees: [],
          splitMode: 'equal',
          percentageAssignments: {},
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
  resetSession,
  setStep,
  addParticipant,
  removeParticipant,
  updateReceipt,
  addItem,
  updateItem,
  removeItem,
  assignItemToUser,
  unassignItemFromUser,
  toggleAllAssignees,
  setGlobalCurrency,
  setItemSplitMode,
  setPercentageAssignment,
  setCurrentAssignmentIndex,
  setSettlements,
  toggleSettlementPaid,
} = sessionSlice.actions;

export default sessionSlice.reducer;
