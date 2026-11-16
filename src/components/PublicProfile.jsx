import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import UserCard from "./UserCard";
import Loader from "./Loader";
import MatchModal from "./MatchModal";
import useUserActions from "../hooks/useUserActions";
import useConfirm from "../hooks/useConfirm";
import api, { getErrorMessage, getStatus } from "../utils/api";

const fetchProfile = (userId) => api.get(`/user/${userId}`).then((res) => res.data);
const describeError = (err) =>
  getStatus(err) === 404 ? "This user isn't available." : getErrorMessage(err);

function PublicProfileView({ userId }) {
  const navigate = useNavigate();
  const me = useSelector((state) => state.user);
  const actions = useUserActions();
  const [confirm, confirmModal] = useConfirm();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState(null);

  const load = useCallback(
    () =>
      fetchProfile(userId)
        .then(setProfile)
        .catch((err) => setError(describeError(err))),
    [userId],
  );

  useEffect(() => {
    fetchProfile(userId)
      .then(setProfile)
      .catch((err) => setError(describeError(err)));
  }, [userId]);

  // Run an action, then reload so the buttons reflect the new relationship.
  const run = async (fn) => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (result) await load();
    return result;
  };

  const ask = (title, message, confirmLabel) => confirm({ title, message, confirmLabel, danger: true });

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="opacity-70">{error}</p>
        <button className="btn btn-sm mt-4" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }
  if (!profile) return <Loader />;

  const isMe = profile._id === me._id;
  const conn = profile.connection;
  const name = profile.firstName;

  const swipe = async (status) => {
    const result = await run(() => actions.swipe(profile, status));
    if (result?.matched) setMatch(profile);
  };
  const review = (status) =>
    run(() => actions.review({ _id: conn.requestId, fromUserId: profile }, status));
  const unmatch = async () => {
    if (await ask(`Unmatch ${name}?`, "You'll be removed from each other's connections.", "Unmatch"))
      run(() => actions.unmatch(profile._id));
  };
  const block = async () => {
    if (await ask(`Block ${name}?`, "They won't be able to see you or message you.", "Block"))
      run(() => actions.block(profile._id));
  };

  let buttons = null;
  if (isMe) {
    buttons = (
      <Link to="/profile" className="btn btn-primary btn-sm">
        Edit profile
      </Link>
    );
  } else if (!conn || conn.status === "ignored" || conn.status === "rejected") {
    // ignored / rejected: the backend keeps the record, so a new swipe returns 409.
    buttons = conn ? (
      // Don't reveal that the other person passed on / rejected me.
      <span className="badge">{conn.status === "ignored" && conn.sentByMe ? "You passed" : "Not connected"}</span>
    ) : (
      <>
        <button className="btn btn-outline btn-error btn-sm" disabled={busy} onClick={() => swipe("ignored")}>
          Pass
        </button>
        <button className="btn btn-success btn-sm" disabled={busy} onClick={() => swipe("interested")}>
          Interested
        </button>
      </>
    );
  } else if (conn.status === "interested" && conn.sentByMe) {
    buttons = (
      <>
        <span className="badge badge-info">Request sent</span>
        <button className="btn btn-sm btn-outline" disabled={busy} onClick={() => run(() => actions.withdraw(profile._id))}>
          Withdraw
        </button>
      </>
    );
  } else if (conn.status === "interested") {
    buttons = (
      <>
        <button className="btn btn-sm btn-outline" disabled={busy} onClick={() => review("rejected")}>
          Reject
        </button>
        <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => review("accepted")}>
          Accept
        </button>
      </>
    );
  } else if (conn.status === "accepted") {
    buttons = (
      <>
        <span className="badge badge-success">Connected</span>
        <button className="btn btn-sm btn-outline" disabled={busy} onClick={unmatch}>
          Unmatch
        </button>
      </>
    );
  } else if (conn.status === "blocked") {
    buttons = (
      <button className="btn btn-sm" disabled={busy} onClick={() => run(() => actions.unblock(profile._id))}>
        Unblock
      </button>
    );
  }

  const showBlock = !isMe && conn?.status !== "blocked";

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      <UserCard
        user={profile}
        actions={
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {buttons}
            {showBlock && (
              <button className="btn btn-sm btn-ghost text-error" disabled={busy} onClick={block}>
                Block
              </button>
            )}
          </div>
        }
      />
      <MatchModal user={match} onClose={() => setMatch(null)} />
      {confirmModal}
    </div>
  );
}

// Keyed by userId so moving between profiles starts with fresh state.
function PublicProfile() {
  const { userId } = useParams();
  return <PublicProfileView key={userId} userId={userId} />;
}

export default PublicProfile;
