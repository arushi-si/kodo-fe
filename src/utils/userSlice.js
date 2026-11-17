import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    addUser: (state, action) => action.payload,
    // Merge a partial update, e.g. { photos, photoUrl } from the photo endpoints.
    updateUser: (state, action) => (state ? { ...state, ...action.payload } : state),
    removeUser: () => null,
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => null),
});

export const { addUser, updateUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
