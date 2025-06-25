import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // In Next.js 15, props like `searchParams` are special, read-only objects.
      // The default Redux middleware tries to check if every piece of data in an action
      // is "serializable" (can be converted to plain text), which causes a crash when it
      // inspects the `searchParams` object.
      // Disabling this check is the most robust way to prevent this class of errors.
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
