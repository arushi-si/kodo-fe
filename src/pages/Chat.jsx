import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Ellipsis, SendHorizontal } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import Loader from "../components/ui/Loader";
import { ListSkeleton } from "../components/ui/Skeleton";
import useUserActions from "../hooks/useUserActions";
import useConfirm from "../hooks/useConfirm";
import useMeta from "../hooks/useMeta";
import api, { getErrorMessage, getStatus } from "../utils/api";
import { emitWithAck, getSocket } from "../utils/socket";
import { inboxMessage, markInboxRead, setActiveChat } from "../utils/chatSlice";
import { showToast } from "../utils/toastSlice";
import { formatTime } from "../utils/helpers";

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
  const navigate = useNavigate();
  const { unmatch, block } = useUserActions();
  const [confirm, confirmModal] = useConfirm();
  const { meta } = useMeta();
  const messageMax = meta?.limits.messageMax ?? 2000;

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

  const onUnmatch = async () => {
    const ok = await confirm({
      title: `Unmatch ${other.firstName}?`,
      message: "You'll be removed from each other's connections and this chat will close.",
      confirmLabel: "Unmatch",
      danger: true,
    });
    if (ok && (await unmatch(userId))) navigate("/chats", { replace: true });
  };

  const onBlock = async () => {
    const ok = await confirm({
      title: `Block ${other.firstName}?`,
      message: "They won't be able to see you or message you. You can unblock them in Settings.",
      confirmLabel: "Block",
      danger: true,
    });
    if (ok && (await block(userId))) navigate("/chats", { replace: true });
  };

  const header = (
    <header className="shrink-0 bg-base-100/90 backdrop-blur-md border-b border-white/5 pt-safe">
      <div className="flex items-center gap-2 px-2 h-16">
        <Link to="/chats" className="btn btn-ghost btn-circle" aria-label="Back to chats">
          <ChevronLeft className="size-6" />
        </Link>
        {other && (
          <>
            <Link to={`/user/${other._id}`} className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar user={other} />
              <div className="min-w-0">
                <div className="font-semibold truncate">{other.firstName}</div>
                <div className="text-xs h-4 truncate">
                  {otherTyping && !closed ? (
                    <span className="font-mono text-accent">typing…</span>
                  ) : (
                    <span className="text-muted">{other.headline}</span>
                  )}
                </div>
              </div>
            </Link>
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="More actions">
                <Ellipsis className="size-5" />
              </button>
              <ul tabIndex="-1" className="dropdown-content menu bg-base-300 rounded-2xl z-10 w-48 p-2 shadow-xl">
                <li>
                  <Link to={`/user/${other._id}`} className="h-11">View profile</Link>
                </li>
                {!closed && (
                  <li>
                    <button className="h-11" onClick={onUnmatch}>Unmatch</button>
                  </li>
                )}
                <li>
                  <button className="h-11 text-error" onClick={onBlock}>Block</button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </header>
  );

  if (error) {
    return (
      <div className="h-dvh flex flex-col">
        {header}
        <div className="text-center py-16 px-6">
          <p className="text-muted">{error}</p>
          <Link to="/chats" className="btn bg-neutral border-0 mt-4">
            Back to chats
          </Link>
        </div>
      </div>
    );
  }

  const lastMineIndex = messages.findLastIndex((m) => m.senderId === me._id);

  return (
    <div className="h-dvh flex flex-col">
      {header}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        onScroll={(e) => e.currentTarget.scrollTop < 60 && loadOlder()}
      >
        {!other ? (
          <ListSkeleton rows={4} />
        ) : (
          <>
            {loadingOlder && <Loader className="py-2" />}
            {!hasMore && messages.length > 0 && (
              <p className="text-center font-mono text-xs text-muted pb-3">{"// start of your conversation"}</p>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center gap-3 py-12">
                <Avatar user={other} size="xl" ring />
                <p className="font-display text-xl font-semibold">You matched with {other.firstName}</p>
                <p className="text-muted text-sm max-w-60">
                  Open with their prompt, their side project, or a hot take about tabs.
                </p>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.senderId === me._id;
              return (
                <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
                  <div
                    className={`chat-bubble before:hidden whitespace-pre-wrap break-words rounded-3xl text-[15px] ${
                      mine ? "bg-mine text-white" : "bg-base-300 text-base-content"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="chat-footer text-muted text-[11px] mt-0.5">
                    {formatTime(m.createdAt)}
                    {mine && i === lastMineIndex && m.readAt && <span className="font-mono text-accent"> · seen</span>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {closed ? (
        <div role="alert" className="shrink-0 m-3 mb-[calc(0.75rem+env(safe-area-inset-bottom))] rounded-2xl bg-base-200 p-4 text-center text-muted">
          This conversation is no longer available.
        </div>
      ) : (
        <form
          onSubmit={send}
          className="shrink-0 flex gap-2 items-end px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-base-100"
        >
          <div className="flex-1">
            <textarea
              className="textarea w-full min-h-12 max-h-32 rounded-3xl bg-neutral border-0 px-4 py-3 leading-snug resize-none focus:outline-2 focus:outline-primary"
              rows={1}
              placeholder={other ? `Message ${other.firstName}` : "Message"}
              aria-label="Message"
              maxLength={messageMax}
              value={draft}
              disabled={!other}
              onChange={onDraftChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
            />
            {draft.length > messageMax - 200 && (
              <p className="font-mono text-[11px] text-muted text-right pr-2">
                {draft.length}/{messageMax}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-circle size-12 btn-brand"
            aria-label="Send"
            disabled={sending || !draft.trim()}
          >
            <SendHorizontal className="size-5" />
          </button>
        </form>
      )}
      {confirmModal}
    </div>
  );
}

// Keyed by userId so switching conversations starts with fresh state.
function Chat() {
  const { userId } = useParams();
  return <ChatView key={userId} userId={userId} />;
}

export default Chat;
