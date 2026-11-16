import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

const initialState = { users: [], loaded: false };

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    setConnections: (state, action) => {
      state.users = action.payload;
      state.loaded = true;
    },
    addConnection: (state, action) => {
      if (!state.users.some((u) => u._id === action.payload._id)) state.users.unshift(action.payload);
    },
    removeConnection: (state, action) => {
      state.users = state.users.filter((u) => u._id !== action.payload);
    },
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => initialState),
});

export const { setConnections, addConnection, removeConnection } = connectionsSlice.actions;
export default connectionsSlice.reducer;
