import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    addUser: (state, action) => action.payload,
    removeUser: () => null,
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => null),
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
