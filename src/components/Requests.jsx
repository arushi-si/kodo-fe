import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Loader from "./Loader";
import useUserActions from "../hooks/useUserActions";
import api, { getErrorMessage } from "../utils/api";
import { setReceived, setSent } from "../utils/requestsSlice";
import { showToast } from "../utils/toastSlice";
import { fullName } from "../utils/helpers";

function PersonRow({ user, children }) {
  return (
    <li className="list-row items-center">
      <Link to={`/user/${user._id}`}>
        <Avatar user={user} size="md" />
      </Link>
      <div className="min-w-0 list-col-grow">
        <Link to={`/user/${user._id}`} className="font-semibold link link-hover">
          {fullName(user)}
        </Link>
        {user.headline && <div className="text-sm opacity-70 truncate">{user.headline}</div>}
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}

function Requests() {
  const dispatch = useDispatch();
  const { received, sent } = useSelector((state) => state.requests);
  const { review, withdraw } = useUserActions();
  const [tab, setTab] = useState("received");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // id of the row with a pending action

  useEffect(() => {
    Promise.all([api.get("/user/requests/received"), api.get("/user/requests/sent")])
      .then(([r, s]) => {
        dispatch(setReceived(r.data));
        dispatch(setSent(s.data));
      })
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const run = async (id, action) => {
    setBusy(id);
    await action();
    setBusy(null);
  };

  const list = tab === "received" ? received : sent;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div role="tablist" className="tabs tabs-box mb-4">
        <button role="tab" className={`tab ${tab === "received" ? "tab-active" : ""}`} onClick={() => setTab("received")}>
          Received ({received.length})
        </button>
        <button role="tab" className={`tab ${tab === "sent" ? "tab-active" : ""}`} onClick={() => setTab("sent")}>
          Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : list.length === 0 ? (
        <p className="text-center opacity-70 py-12">
          {tab === "received" ? "No pending requests." : "You have no pending requests out."}
        </p>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
          {tab === "received"
            ? received.map((req) => (
                <PersonRow key={req._id} user={req.fromUserId}>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={busy === req._id}
                    onClick={() => run(req._id, () => review(req, "rejected"))}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={busy === req._id}
                    onClick={() => run(req._id, () => review(req, "accepted"))}
                  >
                    Accept
                  </button>
                </PersonRow>
              ))
            : sent.map((req) => (
                <PersonRow key={req._id} user={req.toUserId}>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={busy === req._id}
                    onClick={() => run(req._id, () => withdraw(req.toUserId._id))}
                  >
                    Withdraw
                  </button>
                </PersonRow>
              ))}
        </ul>
      )}
    </div>
  );
}

export default Requests;
