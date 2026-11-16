import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Loader from "./Loader";
import api, { getErrorMessage } from "../utils/api";
import { setInbox } from "../utils/chatSlice";
import { showToast } from "../utils/toastSlice";
import { formatTime, fullName } from "../utils/helpers";

function Chats() {
  const dispatch = useDispatch();
  const me = useSelector((state) => state.user);
  const { inbox, loaded } = useSelector((state) => state.chat);

  // Always refresh on open; socket events keep it live afterwards.
  useEffect(() => {
    api
      .get("/chats")
      .then((res) => dispatch(setInbox(res.data)))
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))));
  }, [dispatch]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Chats</h1>
      {!loaded ? (
        <Loader />
      ) : inbox.length === 0 ? (
        <div className="text-center opacity-70 py-12">
          <p>No conversations yet.</p>
          <Link to="/connections" className="btn btn-primary btn-sm mt-4">
            Message a connection
          </Link>
        </div>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
          {inbox.map((chat) => {
            const mine = chat.lastMessage?.senderId === me._id;
            return (
              <li key={chat.chatId}>
                <Link to={`/chat/${chat.user._id}`} className="list-row items-center hover:bg-base-200">
                  <Avatar user={chat.user} size="md" />
                  <div className="min-w-0 list-col-grow">
                    <div className="flex justify-between gap-2">
                      <span className={chat.unreadCount ? "font-bold" : "font-semibold"}>{fullName(chat.user)}</span>
                      <span className="text-xs opacity-60 shrink-0">{formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <div className={`text-sm truncate ${chat.unreadCount ? "font-semibold" : "opacity-70"}`}>
                      {mine && "You: "}
                      {chat.lastMessage?.text}
                    </div>
                  </div>
                  {chat.unreadCount > 0 && <span className="badge badge-primary badge-sm">{chat.unreadCount}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Chats;
