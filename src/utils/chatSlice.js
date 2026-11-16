import { createSlice } from "@reduxjs/toolkit";
import { resetAll } from "./resetAll";

// inbox entries: { chatId, user, lastMessage, lastMessageAt, unreadCount }
const initialState = { inbox: [], loaded: false, stale: false, activeUserId: null };

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setInbox: (state, action) => {
      state.inbox = action.payload;
      state.loaded = true;
      state.stale = false;
    },
    // A message was sent or received with otherUserId. Bumps the chat to the top.
    inboxMessage: (state, action) => {
      const { otherUserId, message, incoming } = action.payload;
      const index = state.inbox.findIndex((c) => c.user._id === otherUserId);
      if (index === -1) {
        state.stale = true; // first message of a new chat: refetch to get the user
        return;
      }
      const [entry] = state.inbox.splice(index, 1);
      entry.lastMessage = { text: message.text, senderId: message.senderId, createdAt: message.createdAt };
      entry.lastMessageAt = message.createdAt;
      if (incoming && state.activeUserId !== otherUserId) entry.unreadCount += 1;
      state.inbox.unshift(entry);
    },
    markInboxRead: (state, action) => {
      const entry = state.inbox.find((c) => c.user._id === action.payload);
      if (entry) entry.unreadCount = 0;
    },
    removeInboxUser: (state, action) => {
      state.inbox = state.inbox.filter((c) => c.user._id !== action.payload);
    },
    setActiveChat: (state, action) => {
      state.activeUserId = action.payload;
    },
  },
  extraReducers: (builder) => builder.addCase(resetAll, () => initialState),
});

export const selectUnreadTotal = (state) =>
  state.chat.inbox.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

export const { setInbox, inboxMessage, markInboxRead, removeInboxUser, setActiveChat } = chatSlice.actions;
export default chatSlice.reducer;
