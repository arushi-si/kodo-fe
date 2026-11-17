import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import { ListSkeleton, SkeletonBlock } from "../components/ui/Skeleton";
import api, { getErrorMessage } from "../utils/api";
import { setInbox } from "../utils/chatSlice";
import { setConnections } from "../utils/connectionsSlice";
import { showToast } from "../utils/toastSlice";
import { formatTime } from "../utils/helpers";

// New matches (connections with no messages yet) as a row of avatars.
function NewMatches({ users }) {
  return (
    <section className="pb-4">
      <h2 className="px-4 mb-3 font-mono text-xs text-accent">{`// new matches (${users.length})`}</h2>
      <ul className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-1">
        {users.map((u) => (
          <li key={u._id} className="shrink-0">
            <Link to={`/chat/${u._id}`} className="flex flex-col items-center gap-1.5 w-[4.5rem]">
              <Avatar user={u} size="lg" ring />
              <span className="text-sm truncate w-full text-center">{u.firstName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chats() {
  const dispatch = useDispatch();
  const me = useSelector((state) => state.user);
  const { inbox, loaded } = useSelector((state) => state.chat);
  const connections = useSelector((state) => state.connections);

  // Always refresh on open; socket events keep the inbox live afterwards.
  useEffect(() => {
    api
      .get("/chats")
      .then((res) => dispatch(setInbox(res.data)))
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))));
    api
      .get("/user/connections")
      .then((res) => dispatch(setConnections(res.data)))
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))));
  }, [dispatch]);

  const chatting = new Set(inbox.map((c) => c.user._id));
  const newMatches = connections.users.filter((u) => !chatting.has(u._id));
  const ready = loaded && connections.loaded;

  return (
    <div>
      <PageHeader title="Chats" />
      {!ready ? (
        <div className="px-4">
          <div className="flex gap-4 pb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonBlock key={i} className="size-20 rounded-full" />
            ))}
          </div>
          <ListSkeleton />
        </div>
      ) : inbox.length === 0 && newMatches.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-9" />}
          comment="no open connections"
          title="No matches yet"
          action={
            <Link to="/feed" className="btn btn-brand px-6">
              Start swiping
            </Link>
          }
        >
          Match with someone and you can chat here.
        </EmptyState>
      ) : (
        <>
          {newMatches.length > 0 && <NewMatches users={newMatches} />}
          <section>
            <h2 className="px-4 mb-1 font-mono text-xs text-muted">{"// messages"}</h2>
            {inbox.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted">Say hi to one of your new matches.</p>
            ) : (
              <ul>
                {inbox.map((chat) => {
                  const mine = chat.lastMessage?.senderId === me._id;
                  const unread = chat.unreadCount > 0;
                  return (
                    <li key={chat.chatId}>
                      <Link
                        to={`/chat/${chat.user._id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200"
                      >
                        <Avatar user={chat.user} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <span className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>
                              {chat.user.firstName}
                            </span>
                            <span className={`text-xs shrink-0 ${unread ? "text-primary" : "text-muted"}`}>
                              {formatTime(chat.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`flex-1 text-sm truncate ${unread ? "text-base-content font-medium" : "text-muted"}`}>
                              {mine && "You: "}
                              {chat.lastMessage?.text}
                            </p>
                            {unread && (
                              <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-content text-[11px] font-bold grid place-items-center">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Chats;
