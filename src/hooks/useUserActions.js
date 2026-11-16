import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import api, { getErrorMessage, getStatus } from "../utils/api";
import { removeUserFromFeed } from "../utils/feedSlice";
import { addConnection, removeConnection } from "../utils/connectionsSlice";
import { removeReceived, removeRequestsWithUser, removeSentTo } from "../utils/requestsSlice";
import { showToast } from "../utils/toastSlice";
import { removeInboxUser } from "../utils/chatSlice";

// Every relationship action in one place, so every screen updates the store the same way.
// Each action resolves to a result (or true) on success and null on failure (a toast is shown).
export default function useUserActions() {
  const dispatch = useDispatch();

  const fail = useCallback(
    (err) => {
      dispatch(showToast("error", getErrorMessage(err)));
      return null;
    },
    [dispatch],
  );

  // status: "interested" (right) | "ignored" (left). Resolves to { matched }.
  const swipe = useCallback(
    async (user, status) => {
      dispatch(removeUserFromFeed(user._id));
      try {
        const res = await api.post(`/request/send/${status}/${user._id}`);
        if (res.data.matched) {
          dispatch(addConnection(user));
          dispatch(removeRequestsWithUser(user._id));
        }
        return { matched: Boolean(res.data.matched) };
      } catch (err) {
        // 409: we already swiped on this user (e.g. another tab). Treat as done.
        if (getStatus(err) === 409) return { matched: false };
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  // request: a received ConnectionRequest with fromUserId populated.
  const review = useCallback(
    async (request, status) => {
      try {
        await api.post(`/request/review/${status}/${request._id}`);
        dispatch(removeReceived(request._id));
        if (status === "accepted") {
          dispatch(addConnection(request.fromUserId));
          dispatch(showToast("success", `You're now connected with ${request.fromUserId.firstName}`));
        }
        return true;
      } catch (err) {
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  const withdraw = useCallback(
    async (userId) => {
      try {
        await api.delete(`/request/send/${userId}`);
        dispatch(removeSentTo(userId));
        dispatch(showToast("info", "Request withdrawn"));
        return true;
      } catch (err) {
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  const unmatch = useCallback(
    async (userId) => {
      try {
        await api.delete(`/request/connection/${userId}`);
        dispatch(removeConnection(userId));
        dispatch(removeInboxUser(userId));
        dispatch(showToast("info", "Unmatched"));
        return true;
      } catch (err) {
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  const block = useCallback(
    async (userId) => {
      try {
        await api.post(`/request/block/${userId}`);
        dispatch(removeUserFromFeed(userId));
        dispatch(removeConnection(userId));
        dispatch(removeRequestsWithUser(userId));
        dispatch(removeInboxUser(userId));
        dispatch(showToast("info", "User blocked"));
        return true;
      } catch (err) {
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  const unblock = useCallback(
    async (userId) => {
      try {
        await api.delete(`/request/block/${userId}`);
        dispatch(showToast("info", "User unblocked"));
        return true;
      } catch (err) {
        return fail(err);
      }
    },
    [dispatch, fail],
  );

  return useMemo(
    () => ({ swipe, review, withdraw, unmatch, block, unblock }),
    [swipe, review, withdraw, unmatch, block, unblock],
  );
}
