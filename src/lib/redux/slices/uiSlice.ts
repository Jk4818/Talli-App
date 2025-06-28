import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  isMobile: boolean | null; // null on server, boolean on client
}

const initialState: UIState = {
  isMobile: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
  },
});

export const { setIsMobile } = uiSlice.actions;
export default uiSlice.reducer;
