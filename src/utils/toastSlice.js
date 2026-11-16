import { createSlice } from "@reduxjs/toolkit";

let nextId = 1;

const toastSlice = createSlice({
  name: "toast",
  initialState: [],
  reducers: {
    showToast: {
      reducer: (state, action) => {
        state.push(action.payload);
      },
      // usage: dispatch(showToast("success", "Saved!"))  type: success | error | info
      prepare: (type, message) => ({ payload: { id: nextId++, type, message } }),
    },
    dismissToast: (state, action) => state.filter((t) => t.id !== action.payload),
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
