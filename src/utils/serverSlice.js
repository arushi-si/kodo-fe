import { createSlice } from "@reduxjs/toolkit";

// Reachability of the backend, shown by <ServerStatus />.
//  up     - last request got through
//  waking - requests are failing with 502/503/504 (the free Render server is starting up) and
//           are being retried automatically
//  down   - retries ran out; the user can try again
const serverSlice = createSlice({
  name: "server",
  initialState: { status: "up", since: null },
  reducers: {
    serverWaking: {
      reducer: (state, action) => {
        if (state.status === "waking") return;
        state.status = "waking";
        state.since = action.payload;
      },
      prepare: () => ({ payload: Date.now() }),
    },
    serverUp: () => ({ status: "up", since: null }),
    serverDown: (state) => {
      state.status = "down";
    },
  },
});

export const { serverWaking, serverUp, serverDown } = serverSlice.actions;
export default serverSlice.reducer;
