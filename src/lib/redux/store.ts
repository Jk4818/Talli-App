import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['session/processReceipt/fulfilled', 'session/processReceipt/rejected'],
        // Ignore these field paths in all actions
        // Next.js's searchParams object is not serializable and will cause an error when the middleware
        // tries to enumerate its properties. This ignores them in any dispatched actions.
        ignoredActionPaths: ['meta.arg', 'payload.timestamp', 'params', 'searchParams'],
        // Ignore these paths in the state
        ignoredPaths: ['session.items', 'session.receipts'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
