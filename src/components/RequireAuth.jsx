import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import { setReceived } from "../utils/requestsSlice";
import { removeConnection } from "../utils/connectionsSlice";
import { inboxMessage, removeInboxUser, setInbox } from "../utils/chatSlice";
import { disconnectSocket, getSocket } from "../utils/socket";

const fetchInbox = () => api.get("/chats").then((res) => res.data);

function RequireAuth() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const inboxStale = useSelector((state) => state.chat.stale);
  const userId = user?._id;

  // Once per login: badge data + the realtime socket. Logging out (user -> null) disconnects it.
  useEffect(() => {
    if (!userId) return;
    api
      .get("/user/requests/received")
      .then((res) => dispatch(setReceived(res.data)))
      .catch((err) => console.error(err));
    fetchInbox()
      .then((inbox) => dispatch(setInbox(inbox)))
      .catch((err) => console.error(err));

    const socket = getSocket();
    const onInboxUpdated = ({ fromUserId, message }) =>
      dispatch(inboxMessage({ otherUserId: fromUserId, message, incoming: true }));
    const onChatClosed = ({ userIds }) => {
      const other = userIds.find((id) => id !== userId);
      dispatch(removeConnection(other));
      dispatch(removeInboxUser(other));
    };
    socket.on("inboxUpdated", onInboxUpdated);
    socket.on("chatClosed", onChatClosed);
    return () => {
      socket.off("inboxUpdated", onInboxUpdated);
      socket.off("chatClosed", onChatClosed);
      disconnectSocket();
    };
  }, [dispatch, userId]);

  // A message arrived for a chat we don't have in the inbox yet.
  useEffect(() => {
    if (!inboxStale) return;
    fetchInbox()
      .then((inbox) => dispatch(setInbox(inbox)))
      .catch((err) => console.error(err));
  }, [dispatch, inboxStale]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default RequireAuth;
