import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import requestsReducer from "./requestsSlice";
import connectionsReducer from "./connectionsSlice";
import toastReducer from "./toastSlice";
import chatReducer from "./chatSlice";
import metaReducer from "./metaSlice";
import serverReducer from "./serverSlice";

export const appStore = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    requests: requestsReducer,
    connections: connectionsReducer,
    toast: toastReducer,
    chat: chatReducer,
    meta: metaReducer,
    server: serverReducer,
  },
});
