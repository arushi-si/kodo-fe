import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import Avatar from "./Avatar";
import Loader from "./Loader";
import api, { getErrorMessage, getStatus } from "../utils/api";
import { emitWithAck, getSocket } from "../utils/socket";
import { inboxMessage, markInboxRead, setActiveChat } from "../utils/chatSlice";
import { showToast } from "../utils/toastSlice";
import { LIMITS } from "../utils/constant";
import { formatTime, fullName } from "../utils/helpers";

const PAGE_SIZE = 30;
const TYPING_IDLE_MS = 1500;

const fetchHistory = (userId, before) =>
  api
    .get(`/chat/${userId}`, { params: { limit: PAGE_SIZE, ...(before && { before }) } })
    .then((res) => res.data);

// Append messages we don't already have (the sender gets both the ack and messageReceived).
const mergeMessages = (list, incoming) => {
  const ids = new Set(list.map((m) => m._id));
  const fresh = incoming.filter((m) => !ids.has(m._id));
  return fresh.length ? [...list, ...fresh] : list;
};

function ChatView({ userId }) {
  const dispatch = useDispatch();
  const me = useSelector((state) => state.user);
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState(null); // can't open this chat at all
  const [closed, setClosed] = useState(false); // unmatched / blocked while open
  const [otherTyping, setOtherTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const scrollMode = useRef("bottom"); // "bottom" | "keep" | null — applied after the next render
  const prevScrollHeight = useRef(0);
  const typingTimer = useRef(null);
  const amTyping = useRef(false);

  const markRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    emitWithAck("markRead", { targetUserId: userId }).then((res) => {
      if (res?.ok) dispatch(markInboxRead(userId));
    });
  }, [dispatch, userId]);

  // History + realtime subscription for this conversation.
  useEffect(() => {
    const socket = getSocket();
    dispatch(setActiveChat(userId));

    const join = () =>
      emitWithAck("joinChat", { targetUserId: userId }).then((res) => {
        if (res?.ok) markRead();
        else if (res?.status === 403) setClosed(true);
      });

    fetchHistory(userId)
      .then((data) => {
        setOther(data.user);
        setMessages(data.messages);
        setHasMore(data.hasMore);
        join();
      })
      .catch((err) =>
        setError(getStatus(err) === 403 ? "You're not connected with this user." : getErrorMessage(err)),
      );

    const onMessage = (message) => {
      if (message.senderId !== userId && message.senderId !== me._id) return;
      scrollMode.current = "bottom";
      setMessages((list) => mergeMessages(list, [message]));
      if (message.senderId === userId) {
        setOtherTyping(false);
        markRead();
      }
    };
    const onTyping = ({ userId: typer, isTyping }) => {
      if (typer === userId) setOtherTyping(isTyping);
    };
    const onRead = ({ readerId, readAt }) => {
      if (readerId !== userId) return;
      setMessages((list) => list.map((m) => (m.senderId === me._id && !m.readAt ? { ...m, readAt } : m)));
    };
    const onClosed = ({ userIds }) => {
      if (userIds.includes(userId)) setClosed(true);
    };
    const onVisible = () => markRead();

    socket.on("messageReceived", onMessage);
    socket.on("typing", onTyping);
    socket.on("messagesRead", onRead);
    socket.on("chatClosed", onClosed);
    socket.io.on("reconnect", join); // rooms are lost on reconnect
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      socket.off("messageReceived", onMessage);
      socket.off("typing", onTyping);
      socket.off("messagesRead", onRead);
      socket.off("chatClosed", onClosed);
      socket.io.off("reconnect", join);
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(typingTimer.current);
      if (socket.connected) socket.emit("leaveChat", { targetUserId: userId });
      dispatch(setActiveChat(null));
    };
  }, [dispatch, markRead, me._id, userId]);

  // Stick to the bottom for new messages; keep position when older ones are prepended.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (scrollMode.current === "bottom") el.scrollTop = el.scrollHeight;
    else if (scrollMode.current === "keep") el.scrollTop = el.scrollHeight - prevScrollHeight.current;
    scrollMode.current = null;
  }, [messages]);

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const data = await fetchHistory(userId, messages[0].createdAt);
      prevScrollHeight.current = listRef.current.scrollHeight;
      scrollMode.current = "keep";
      setMessages((list) => {
        const ids = new Set(list.map((m) => m._id));
        return [...data.messages.filter((m) => !ids.has(m._id)), ...list];
      });
      setHasMore(data.hasMore);
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    } finally {
      setLoadingOlder(false);
    }
  };

  const setTyping = (isTyping) => {
    if (amTyping.current === isTyping) return;
    amTyping.current = isTyping;
    getSocket().emit("typing", { targetUserId: userId, isTyping });
  };

  const onDraftChange = (e) => {
    setDraft(e.target.value);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
  };

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || closed) return;
    setSending(true);
    clearTimeout(typingTimer.current);
    setTyping(false);
    const res = await emitWithAck("sendMessage", { targetUserId: userId, text });
    setSending(false);
    if (!res?.ok) {
      if (res?.status === 403) setClosed(true);
      return dispatch(showToast("error", res?.error ?? "Message not sent"));
    }
    setDraft("");
    scrollMode.current = "bottom";
    setMessages((list) => mergeMessages(list, [res.message]));
    dispatch(inboxMessage({ otherUserId: userId, message: res.message, incoming: false }));
  };

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="opacity-70">{error}</p>
        <Link to="/chats" className="btn btn-sm mt-4">
          Back to chats
        </Link>
      </div>
    );
  }
  if (!other) return <Loader />;

  const lastMineIndex = messages.findLastIndex((m) => m.senderId === me._id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100dvh-10rem)]">
      <div className="flex items-center gap-3 pb-3 border-b border-base-300">
        <Link to="/chats" className="btn btn-ghost btn-sm" aria-label="Back to chats">
          ←
        </Link>
        <Link to={`/user/${other._id}`} className="flex items-center gap-3">
          <Avatar user={other} />
          <div>
            <div className="font-semibold">{fullName(other)}</div>
            <div className="text-xs opacity-60 h-4">{otherTyping && !closed ? "typing…" : other.headline}</div>
          </div>
        </Link>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-4"
        onScroll={(e) => e.currentTarget.scrollTop < 60 && loadOlder()}
      >
        {loadingOlder && <Loader className="py-2" />}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-xs opacity-50 pb-2">Start of your conversation</p>
        )}
        {messages.length === 0 && (
          <p className="text-center opacity-60 py-8">Say hi to {other.firstName} 👋</p>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === me._id;
          return (
            <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
              <div className={`chat-bubble whitespace-pre-wrap break-words ${mine ? "chat-bubble-primary" : ""}`}>
                {m.text}
              </div>
              <div className="chat-footer opacity-50 text-xs">
                {formatTime(m.createdAt)}
                {mine && i === lastMineIndex && m.readAt && " · Seen"}
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <div role="alert" className="alert">
          This conversation is no longer available.
        </div>
      ) : (
        <form onSubmit={send} className="flex gap-2 items-end pt-2">
          <div className="flex-1">
            <textarea
              className="textarea w-full min-h-0"
              rows={1}
              placeholder="Type a message"
              maxLength={LIMITS.messageMax}
              value={draft}
              onChange={onDraftChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
            />
            {draft.length > LIMITS.messageMax - 200 && (
              <p className="text-xs opacity-60 text-right">
                {draft.length}/{LIMITS.messageMax}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}

// Keyed by userId so switching conversations starts with fresh state.
function Chat() {
  const { userId } = useParams();
  return <ChatView key={userId} userId={userId} />;
}

export default Chat;
