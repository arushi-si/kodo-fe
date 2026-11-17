import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Check, Ellipsis, Heart, MessageCircle, X } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import FullProfile from "../components/profile/FullProfile";
import MatchModal from "../components/feed/MatchModal";
import { CardSkeleton, SkeletonBlock } from "../components/ui/Skeleton";
import useUserActions from "../hooks/useUserActions";
import useConfirm from "../hooks/useConfirm";
import api, { getErrorMessage, getStatus } from "../utils/api";

const fetchProfile = (userId) => api.get(`/user/${userId}`).then((res) => res.data);
const describeError = (err) => (getStatus(err) === 404 ? "This user isn't available." : getErrorMessage(err));

const ghost = "btn btn-lg h-14 flex-1 bg-base-200 border border-white/10";

function UserProfileView({ userId }) {
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
      <div>
        <PageHeader back title="" />
        <div className="text-center py-16 px-6">
          <p className="text-muted">{error}</p>
          <button className="btn bg-neutral border-0 mt-4" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div>
        <PageHeader back title="" />
        <div className="px-4 flex flex-col gap-4">
          <SkeletonBlock className="h-10 w-1/2 rounded-xl" />
          <CardSkeleton className="aspect-[4/5]" />
        </div>
      </div>
    );
  }

  const isMe = profile._id === me._id;
  const conn = profile.connection;
  const name = profile.firstName;

  const swipe = async (status) => {
    const result = await run(() => actions.swipe(profile, status));
    if (result?.matched) setMatch(profile);
  };
  const review = async (status) => {
    const ok = await run(() => actions.review({ _id: conn.requestId, fromUserId: profile }, status));
    if (ok && status === "accepted") setMatch(profile);
  };
  const unmatch = async () => {
    if (await ask(`Unmatch ${name}?`, "You'll be removed from each other's connections.", "Unmatch"))
      run(() => actions.unmatch(profile._id));
  };
  const block = async () => {
    if (await ask(`Block ${name}?`, "They won't be able to see you or message you.", "Block"))
      run(() => actions.block(profile._id));
  };
  const restore = () => run(() => actions.restore(profile));

  let bar = null;
  if (isMe) {
    bar = (
      <Link to="/profile/edit" className="btn btn-brand btn-lg h-14 flex-1">
        Edit profile
      </Link>
    );
  } else if (!conn) {
    bar = (
      <>
        <button className={`${ghost} text-error`} disabled={busy} onClick={() => swipe("ignored")}>
          <X className="size-6" strokeWidth={3} /> Pass
        </button>
        <button className="btn btn-brand btn-lg h-14 flex-1" disabled={busy} onClick={() => swipe("interested")}>
          <Heart className="size-6" fill="currentColor" /> Like
        </button>
      </>
    );
  } else if (conn.status === "ignored" && conn.sentByMe) {
    bar = (
      <button className={`${ghost} text-accent`} disabled={busy} onClick={restore}>
        You passed · Undo pass
      </button>
    );
  } else if (conn.status === "ignored" || conn.status === "rejected") {
    // Don't reveal that the other person passed on / rejected me.
    bar = <span className="flex-1 text-center text-muted py-4">Not connected</span>;
  } else if (conn.status === "interested" && conn.sentByMe) {
    bar = (
      <>
        <span className="flex-1 grid place-items-center font-mono text-sm text-accent">{"// like sent"}</span>
        <button className={ghost} disabled={busy} onClick={() => run(() => actions.withdraw(profile._id))}>
          Withdraw
        </button>
      </>
    );
  } else if (conn.status === "interested") {
    bar = (
      <>
        <button className={ghost} disabled={busy} onClick={() => review("rejected")}>
          <X className="size-5" /> Reject
        </button>
        <button className="btn btn-brand btn-lg h-14 flex-1" disabled={busy} onClick={() => review("accepted")}>
          <Check className="size-5" /> Accept
        </button>
      </>
    );
  } else if (conn.status === "accepted") {
    bar = (
      <Link to={`/chat/${profile._id}`} className="btn btn-brand btn-lg h-14 flex-1">
        <MessageCircle className="size-5" /> Message
      </Link>
    );
  } else if (conn.status === "blocked") {
    bar = (
      <button className={ghost} disabled={busy} onClick={() => run(() => actions.unblock(profile._id))}>
        Unblock
      </button>
    );
  }

  const menu = !isMe && (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="More actions">
        <Ellipsis className="size-5" />
      </button>
      <ul tabIndex="-1" className="dropdown-content menu bg-base-300 rounded-2xl z-10 w-44 p-2 shadow-xl">
        {conn?.status === "accepted" && (
          <li>
            <button className="h-11" disabled={busy} onClick={unmatch}>
              Unmatch
            </button>
          </li>
        )}
        {conn?.status !== "blocked" && (
          <li>
            <button className="h-11 text-error" disabled={busy} onClick={block}>
              Block
            </button>
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader back title="" right={menu} />
      <div className="flex-1 px-4 pb-6">
        <FullProfile user={profile} />
      </div>
      {bar && (
        <div className="sticky bottom-0 z-20 flex gap-3 bg-gradient-to-t from-base-100 via-base-100/95 to-transparent px-4 pt-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {bar}
        </div>
      )}
      <MatchModal user={match} onClose={() => setMatch(null)} />
      {confirmModal}
    </div>
  );
}

// Keyed by userId so moving between profiles starts with fresh state.
function UserProfile() {
  const { userId } = useParams();
  return <UserProfileView key={userId} userId={userId} />;
}

export default UserProfile;
