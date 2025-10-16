
import { createSlice, createAsyncThunk, type PayloadAction, createAction } from '@reduxjs/toolkit';
import type { SessionState, Participant, Receipt, Item, Discount, ServiceCharge } from '@/lib/types';
import { MOCK_DATA } from '@/lib/mock-data';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import type { AuthUser } from '@/ai/auth';
import { normalizeImageForAI } from '@/lib/image-utils';

const initialState: SessionState = {
  step: 1,
  participants: [],
  receipts: [],
  items: [],
  paidSettlements: {},
  globalCurrency: 'GBP',
  status: 'idle',
  error: null,
  isDemoSession: false,
  currentAssignmentIndex: 0,
};

export const uploadAndProcessReceipt = createAsyncThunk(
  'session/uploadAndProcessReceipt',
  async ({ file, user }: { file: File; user: AuthUser | null }, { rejectWithValue }) => {
    try {
      // Normalize the image before uploading
      const imageDataUri = await normalizeImageForAI(file);

      if (!user) {
        throw new Error('User authentication is required to process receipts.');
      }

      const extractedData = await extractReceiptData({ receiptDataUri: imageDataUri, user });
      
      return {
        name: file.name,
        imageDataUri,
        ...extractedData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not process file.';
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
      
      const sanitizedItems = (importedData.items || []).map((item, index): Item => ({
        id: item.id || `item_${Date.now()}_${index}`,
        receiptId: item.receiptId || '',
        name: item.name || 'New Item',
        quantity: item.quantity || 1,
        unitCost: item.unitCost,
        cost: item.cost || 0,
        discounts: item.discounts || [],
        assignees: item.assignees || [],
        splitMode: item.splitMode || 'equal',
        percentageAssignments: item.percentageAssignments || {},
        exactAssignments: item.exactAssignments || {},
        category: item.category || 'Other',
        subCategory: item.subCategory || undefined,
      }));

      const sanitizedReceipts = (importedData.receipts || []).map((receipt, index): Receipt => ({
        id: receipt.id || `receipt_${Date.now()}_${index}`,
        name: receipt.name || 'New Receipt',
        payerId: receipt.payerId || null,
        discounts: receipt.discounts || [],
        serviceCharge: receipt.serviceCharge || { type: 'fixed', value: 0 },
        currency: receipt.currency || 'USD',
        status: 'processed', // Always mark imported receipts as processed
        imageDataUri: receipt.imageDataUri,
        exchangeRate: receipt.exchangeRate,
        error: receipt.error,
      }));
    
      return {
        ...initialState,
        ...importedData,
        items: sanitizedItems,
        receipts: sanitizedReceipts,
        participants: importedData.participants || [],
        paidSettlements: importedData.paidSettlements || {},
        globalCurrency: importedData.globalCurrency || initialState.globalCurrency,
        step: 1, // Always start at step 1 for validation
        status: 'succeeded',
        error: null,
        isDemoSession: importedData.isDemoSession ?? state.isDemoSession,
        currentAssignmentIndex: 0,
      };
    },
    resetSession: (state) => {
      // Resetting returns to the initial, non-demo state.
      // The demo page is responsible for re-initializing demo mode.
      return {
        ...initialState,
        isDemoSession: false,
      };
    },
    addManualReceipt: (state) => {
        const newReceipt: Receipt = {
          id: `receipt_manual_${new Date().getTime()}`,
          name: 'Manual Receipt',
          imageDataUri: undefined,
          status: 'processed',
          payerId: null,
          discounts: [],
          serviceCharge: { type: 'fixed', value: 0 },
          currency: state.globalCurrency,
        };
        state.receipts.push(newReceipt);
    },
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
    removeReceipt: (state, action: PayloadAction<string>) => {
      const receiptId = action.payload;
      state.receipts = state.receipts.filter((r) => r.id !== receiptId);
      state.items = state.items.filter((i) => i.receiptId !== receiptId);
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
    applySuggestedDiscount: (state, action: PayloadAction<{ receiptId: string; discountId: string; }>) => {
      const { receiptId, discountId } = action.payload;
      const receipt = state.receipts.find(r => r.id === receiptId);
      if (!receipt) return;
    
      const discountIndex = receipt.discounts.findIndex(d => d.id === discountId);
      if (discountIndex === -1) return;
      
      const [discount] = receipt.discounts.splice(discountIndex, 1);
      const targetItem = state.items.find(i => i.id === discount.suggestedItemId);
    
      if (targetItem) {
        if (!targetItem.discounts) {
          targetItem.discounts = [];
        }
        // Remove the suggestion property as it's now applied
        const { suggestedItemId, ...appliedDiscount } = discount;
        targetItem.discounts.push(appliedDiscount);
      } else {
        // If target item not found, put it back
        receipt.discounts.push(discount);
      }
    },
    reassignSuggestedDiscount: (state, action: PayloadAction<{ receiptId: string; discountId: string; newTargetItemId: string }>) => {
      const { receiptId, discountId, newTargetItemId } = action.payload;
      const receipt = state.receipts.find(r => r.id === receiptId);
      if (!receipt) return;

      const discountIndex = receipt.discounts.findIndex(d => d.id === discountId);
      if (discountIndex === -1) return;
      
      const [discount] = receipt.discounts.splice(discountIndex, 1);
      const newTargetItem = state.items.find(i => i.id === newTargetItemId);

      if (newTargetItem) {
        if (!newTargetItem.discounts) {
          newTargetItem.discounts = [];
        }
        // Remove the suggestion property as it's now applied
        const { suggestedItemId, ...appliedDiscount } = discount;
        newTargetItem.discounts.push(appliedDiscount);
      } else {
        // If target item not found for some reason, put it back on the receipt
        receipt.discounts.push(discount);
      }
    },
    ignoreSuggestedDiscount: (state, action: PayloadAction<{ receiptId: string; discountId: string }>) => {
      const { receiptId, discountId } = action.payload;
      const receipt = state.receipts.find(r => r.id === receiptId);
      if (!receipt) return;
    
      const discount = receipt.discounts.find(d => d.id === discountId);
      if (discount) {
        discount.suggestedItemId = null;
      }
    },
    addItem: (state, action: PayloadAction<Item>) => {
        state.items.push(action.payload);
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
    // Reducers for per-item discounts
    addItemDiscount: (state, action: PayloadAction<{ itemId: string }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        const newDiscount: Discount = {
          id: `d_${item.id}_${new Date().getTime()}`,
          name: 'Item Discount',
          amount: 0,
        };
        if (!item.discounts) {
          item.discounts = [];
        }
        item.discounts.push(newDiscount);
      }
    },
    updateItemDiscount: (state, action: PayloadAction<{ itemId: string, discount: Partial<Discount> & { id: string } }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item && item.discounts) {
        const discount = item.discounts.find(d => d.id === action.payload.discount.id);
        if (discount) {
          Object.assign(discount, action.payload.discount);
        }
      }
    },
    removeItemDiscount: (state, action: PayloadAction<{ itemId: string, discountId: string }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item && item.discounts) {
        item.discounts = item.discounts.filter(d => d.id !== action.payload.discountId);
      }
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
    toggleSettlementPaid: (state, action: PayloadAction<{ settlementId: string }>) => {
      const { settlementId } = action.payload;
      const currentStatus = !!state.paidSettlements[settlementId];
      state.paidSettlements[settlementId] = !currentStatus;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDemoData, (state) => {
        const demoState = { ...MOCK_DATA, status: 'succeeded' as const, error: null, isDemoSession: true };
        return { ...initialState, ...demoState, paidSettlements: {}, step: 1 };
      })
      .addCase(uploadAndProcessReceipt.pending, (state, action) => {
        const { file } = action.meta.arg;
        const newReceipt: Receipt = {
          id: action.meta.requestId,
          name: file.name,
          status: 'processing',
          payerId: null,
          discounts: [],
          serviceCharge: { type: 'fixed', value: 0 },
          currency: state.globalCurrency,
        };
        state.receipts.push(newReceipt);
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadAndProcessReceipt.fulfilled, (state, action) => {
        const receipt = state.receipts.find(r => r.id === action.meta.requestId);
        if (receipt) {
          const payload = action.payload;
          receipt.status = 'processed';
          receipt.imageDataUri = payload.imageDataUri;
          receipt.currency = payload.currency || state.globalCurrency;
          receipt.overallConfidence = payload.overallConfidence;

          const tempIdToPermanentIdMap = new Map<string, string>();
          
          const newItems: Item[] = payload.items.map((item, index) => {
            const permanentId = `item_${receipt.id}_${index}`;
            // The AI returns a temporary ID (e.g., "item-1"), we map it to our permanent, state-wide unique ID
            if (item.id) {
              tempIdToPermanentIdMap.set(item.id, permanentId);
            }
            return {
              id: permanentId,
              receiptId: receipt.id,
              name: item.name,
              quantity: item.quantity,
              unitCost: item.unitCost ? Math.round(item.unitCost * 100) : undefined,
              cost: Math.round(item.cost * 100),
              discounts: [],
              assignees: [],
              splitMode: 'equal',
              percentageAssignments: {},
              exactAssignments: {},
              confidence: item.confidence,
              category: item.category || 'Other',
              subCategory: item.subCategory,
            };
          });
          
          receipt.discounts = payload.discounts.map((d, i) => {
            const permanentSuggestedId = d.suggestedItemId ? tempIdToPermanentIdMap.get(d.suggestedItemId) : null;
            return {
              id: `d_${receipt.id}_${i}`,
              name: d.name,
              amount: Math.round(d.amount * 100),
              confidence: d.confidence,
              suggestedItemId: permanentSuggestedId,
            }
          });
          
          const serviceChargeTotal = payload.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0);
          const serviceChargeConfidence = payload.serviceCharges.length > 0 ? payload.serviceCharges.reduce((sum, sc) => sum + (sc.confidence || 0), 0) / payload.serviceCharges.length : undefined;
          
          receipt.serviceCharge = { 
            type: 'fixed', 
            value: Math.round(serviceChargeTotal * 100),
            confidence: serviceChargeConfidence ? Math.round(serviceChargeConfidence) : undefined
          };

          state.items.push(...newItems);
        }
        state.status = 'succeeded';
      })
      .addCase(uploadAndProcessReceipt.rejected, (state, action) => {
        const receipt = state.receipts.find(r => r.id === action.meta.requestId);
        if (receipt) {
          receipt.status = 'failed';
          receipt.error = action.payload as string;
        }
        state.status = 'failed';
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
  removeReceipt,
  updateReceipt,
  updateServiceCharge,
  addDiscount,
  updateDiscount,
  removeDiscount,
  applySuggestedDiscount,
  reassignSuggestedDiscount,
  ignoreSuggestedDiscount,
  addItem,
  updateItem,
  removeItem,
  addItemDiscount,
  updateItemDiscount,
  removeItemDiscount,
  assignItemToUser,
  unassignItemFromUser,
  toggleAllAssignees,
  setGlobalCurrency,
  setItemSplitMode,
  setPercentageAssignment,
  setExactAssignment,
  setCurrentAssignmentIndex,
  toggleSettlementPaid,
  addManualReceipt,
} = sessionSlice.actions;

export default sessionSlice.reducer;
