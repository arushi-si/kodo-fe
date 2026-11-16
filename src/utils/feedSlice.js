import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

const initialState = { users: [], skills: "", exhausted: false, loaded: false };

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    // Swiped users drop out of the server results, so we always refetch page 1
    // and append only the users we don't already hold.
    appendFeed: (state, action) => {
      const seen = new Set(state.users.map((u) => u._id));
      const fresh = action.payload.filter((u) => !seen.has(u._id));
      state.users.push(...fresh);
      state.exhausted = fresh.length === 0;
      state.loaded = true;
    },
    removeUserFromFeed: (state, action) => {
      state.users = state.users.filter((u) => u._id !== action.payload);
    },
    setFeedSkills: (state, action) => ({ ...initialState, skills: action.payload }),
    removeFeed: () => initialState,
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => initialState),
});

export const { appendFeed, removeUserFromFeed, setFeedSkills, removeFeed } = feedSlice.actions;
export default feedSlice.reducer;
