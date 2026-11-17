import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Heart, Send, Undo2, X } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import { GridSkeleton, ListSkeleton } from "../components/ui/Skeleton";
import { DemoBadge } from "../components/profile/Chips";
import MatchModal from "../components/feed/MatchModal";
import useUserActions from "../hooks/useUserActions";
import api, { getErrorMessage } from "../utils/api";
import { setReceived, setSent } from "../utils/requestsSlice";
import { showToast } from "../utils/toastSlice";
import { fullName } from "../utils/helpers";

const TABS = [
  { id: "received", label: "Likes you" },
  { id: "sent", label: "Sent" },
  { id: "passed", label: "Passed" },
];

function Segmented({ tab, onChange, counts }) {
  return (
    <div role="tablist" className="mx-4 mb-3 grid grid-cols-3 rounded-full bg-base-200 p-1 border border-white/5">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className={`h-10 rounded-full text-sm font-medium transition-colors ${
            tab === t.id ? "bg-base-300 text-base-content shadow" : "text-muted"
          }`}
        >
          {t.label}
          {counts[t.id] > 0 && <span className="ml-1 font-mono text-xs text-primary">{counts[t.id]}</span>}
        </button>
      ))}
    </div>
  );
}

// A received like: photo card with Accept / Reject.
function LikeCard({ request, busy, onReview }) {
  const user = request.fromUserId;
  return (
    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-base-300">
      <Link to={`/user/${user._id}`} className="absolute inset-0" aria-label={`View ${user.firstName}'s profile`}>
        <img src={user.photoUrl} alt="" className="size-full object-cover" />
      </Link>
      {user.isDemo && <DemoBadge className="absolute top-2.5 left-2.5" />}
      <div className="absolute inset-x-0 bottom-0 pt-12 pb-2.5 px-2.5 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
        <p className="font-display font-bold text-lg text-white truncate">
          {user.firstName}
          {user.age && <span className="font-normal text-white/75">, {user.age}</span>}
        </p>
        <div className="mt-1.5 flex gap-2 pointer-events-auto">
          <button
            className="btn btn-circle size-11 bg-black/50 backdrop-blur border border-white/15 text-white"
            aria-label={`Reject ${user.firstName}`}
            disabled={busy}
            onClick={() => onReview(request, "rejected")}
          >
            <X className="size-5" strokeWidth={3} />
          </button>
          <button
            className="btn flex-1 h-11 btn-brand"
            aria-label={`Accept ${user.firstName}`}
            disabled={busy}
            onClick={() => onReview(request, "accepted")}
          >
            <Check className="size-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonRow({ user, children }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link to={`/user/${user._id}`}>
        <Avatar user={user} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/user/${user._id}`} className="font-semibold block truncate">
          {fullName(user)}
        </Link>
        {user.headline && <p className="text-sm text-muted truncate">{user.headline}</p>}
      </div>
      {children}
    </li>
  );
}

function Likes() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "received";
  const { received, sent } = useSelector((state) => state.requests);
  const { review, withdraw, restore } = useUserActions();
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(null);
  const [busy, setBusy] = useState(null);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/user/requests/received"), api.get("/user/requests/sent")])
      .then(([r, s]) => {
        dispatch(setReceived(r.data));
        dispatch(setSent(s.data));
      })
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))))
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (tab !== "passed") return;
    api
      .get("/user/passed")
      .then((res) => setPassed(res.data))
      .catch((err) => {
        setPassed([]);
        dispatch(showToast("error", getErrorMessage(err)));
      });
  }, [dispatch, tab]);

  const run = async (id, action) => {
    setBusy(id);
    const result = await action();
    setBusy(null);
    return result;
  };

  const onReview = async (request, status) => {
    const ok = await run(request._id, () => review(request, status));
    if (ok && status === "accepted") setMatch(request.fromUserId);
  };

  const onRestore = async (user) => {
    if (await run(user._id, () => restore(user))) setPassed((list) => list.filter((u) => u._id !== user._id));
  };

  return (
    <div>
      <PageHeader title="Likes" />
      <Segmented
        tab={tab}
        onChange={(id) => setParams(id === "received" ? {} : { tab: id }, { replace: true })}
        counts={{ received: received.length }}
      />
      <div className="px-4 pb-6">
        {tab === "received" &&
          (loading && !received.length ? (
            <GridSkeleton />
          ) : received.length === 0 ? (
            <EmptyState icon={<Heart className="size-9" />} comment="0 pending" title="No likes yet">
              When someone swipes right on you, they show up here.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {received.map((req) => (
                <LikeCard key={req._id} request={req} busy={busy === req._id} onReview={onReview} />
              ))}
            </div>
          ))}

        {tab === "sent" &&
          (loading && !sent.length ? (
            <ListSkeleton />
          ) : sent.length === 0 ? (
            <EmptyState icon={<Send className="size-9" />} comment="nothing in flight" title="No pending likes">
              People you like who haven't answered yet show up here.
            </EmptyState>
          ) : (
            <ul>
              {sent.map((req) => (
                <PersonRow key={req._id} user={req.toUserId}>
                  <button
                    className="btn btn-sm h-10 bg-neutral border-0"
                    disabled={busy === req._id}
                    onClick={() => run(req._id, () => withdraw(req.toUserId._id))}
                  >
                    Withdraw
                  </button>
                </PersonRow>
              ))}
            </ul>
          ))}

        {tab === "passed" &&
          (passed === null ? (
            <ListSkeleton />
          ) : passed.length === 0 ? (
            <EmptyState icon={<Undo2 className="size-9" />} comment="no regrets" title="Nobody passed">
              People you swipe left on show up here, so you can change your mind.
            </EmptyState>
          ) : (
            <ul>
              {passed.map((user) => (
                <PersonRow key={user._id} user={user}>
                  <button
                    className="btn btn-sm h-10 bg-neutral border-0 text-accent"
                    disabled={busy === user._id}
                    onClick={() => onRestore(user)}
                  >
                    <Undo2 className="size-4" /> Undo pass
                  </button>
                </PersonRow>
              ))}
            </ul>
          ))}
      </div>
      <MatchModal user={match} onClose={() => setMatch(null)} />
    </div>
  );
}

export default Likes;
