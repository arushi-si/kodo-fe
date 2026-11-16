import { createAction } from "@reduxjs/toolkit";

// Dispatched on logout or an expired session; every slice handling user data resets on it.
export const resetAll = createAction("app/resetAll");
