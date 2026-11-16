import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

const initialState = { received: [], sent: [] };

const otherUserId = (req, key) => req[key]?._id ?? req[key];

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setReceived: (state, action) => {
      state.received = action.payload;
    },
    setSent: (state, action) => {
      state.sent = action.payload;
    },
    removeReceived: (state, action) => {
      state.received = state.received.filter((r) => r._id !== action.payload);
    },
    removeSentTo: (state, action) => {
      state.sent = state.sent.filter((r) => otherUserId(r, "toUserId") !== action.payload);
    },
    // Drop every pending request involving this user (after block / match).
    removeRequestsWithUser: (state, action) => {
      const id = action.payload;
      state.received = state.received.filter((r) => otherUserId(r, "fromUserId") !== id);
      state.sent = state.sent.filter((r) => otherUserId(r, "toUserId") !== id);
    },
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => initialState),
});

export const { setReceived, setSent, removeReceived, removeSentTo, removeRequestsWithUser } =
  requestsSlice.actions;
export default requestsSlice.reducer;
