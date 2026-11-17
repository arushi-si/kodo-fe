import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

// GET /meta: option lists (genders, experience levels, prompt questions), limits and
// whether photo uploads are enabled. Public and the same for everyone, so it isn't reset on logout.
export const fetchMeta = createAsyncThunk(
  "meta/fetch",
  async () => (await api.get("/meta")).data,
  { condition: (_, { getState }) => !["loading", "ready"].includes(getState().meta.status) },
);

const metaSlice = createSlice({
  name: "meta",
  initialState: { data: null, status: "idle" }, // idle | loading | ready | failed
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchMeta.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMeta.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = "ready";
      })
      .addCase(fetchMeta.rejected, (state) => {
        state.status = "failed";
      }),
});

export default metaSlice.reducer;
