import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SwipeCard from "./SwipeCard";
import MatchModal from "./MatchModal";
import Loader from "./Loader";
import useUserActions from "../hooks/useUserActions";
import useConfirm from "../hooks/useConfirm";
import api, { getErrorMessage } from "../utils/api";
import { appendFeed, setFeedSkills } from "../utils/feedSlice";
import { showToast } from "../utils/toastSlice";
import { FEED_LIMIT, MIN_FEED_CARDS } from "../utils/constant";

const EXIT_MS = 300;

function CardMenu({ user, onBlock }) {
  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-circle btn-sm" aria-label="More actions">
        ⋯
      </button>
      <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow">
        <li>
          <Link to={`/user/${user._id}`}>View profile</Link>
        </li>
        <li>
          <button className="text-error" onClick={onBlock}>
            Block
          </button>
        </li>
      </ul>
    </div>
  );
}

function SkillsFilter({ value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <form
      className="join w-80 sm:w-96"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft.split(",").map((s) => s.trim()).filter(Boolean).join(","));
      }}
    >
      <input
        className="input join-item w-full"
        placeholder="Filter by skills, e.g. react, node"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="btn join-item" type="submit">
        Filter
      </button>
      {value && (
        <button
          className="btn join-item"
          type="button"
          onClick={() => {
            setDraft("");
            onApply("");
          }}
        >
          ✕
        </button>
      )}
    </form>
  );
}

function Feed() {
  const dispatch = useDispatch();
  const { users, skills, exhausted, loaded } = useSelector((state) => state.feed);
  const { swipe, block } = useUserActions();
  const [confirm, confirmModal] = useConfirm();
  const [exiting, setExiting] = useState(null); // { id, dir }
  const [inFlight, setInFlight] = useState(0); // swipes not yet acknowledged by the server
  const [match, setMatch] = useState(null);
  const loading = useRef(false);

  const top = users[0];

  const fetchFeed = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const params = { page: 1, limit: FEED_LIMIT };
      if (skills) params.skills = skills;
      const res = await api.get("/user/feed", { params });
      dispatch(appendFeed(res.data));
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    } finally {
      loading.current = false;
    }
  }, [dispatch, skills]);

  // Initial load, and top-ups once every sent swipe is reflected on the server
  // (otherwise page 1 would return the users we just swiped).
  useEffect(() => {
    const needsMore = !loaded || (users.length < MIN_FEED_CARDS && !exhausted);
    if (needsMore && inFlight === 0) fetchFeed();
  }, [loaded, users.length, exhausted, inFlight, fetchFeed]);

  const doSwipe = useCallback(
    (dir) => {
      if (!top || exiting) return;
      setExiting({ id: top._id, dir });
      setTimeout(async () => {
        setExiting(null);
        setInFlight((n) => n + 1);
        const result = await swipe(top, dir === "right" ? "interested" : "ignored");
        setInFlight((n) => n - 1);
        if (result?.matched) setMatch(top);
      }, EXIT_MS);
    },
    [top, exiting, swipe],
  );

  // Arrow keys swipe, unless the user is typing or a modal is open.
  useEffect(() => {
    const onKey = (e) => {
      if (match || e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") doSwipe("right");
      if (e.key === "ArrowLeft") doSwipe("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSwipe, match]);

  const onBlock = async (user) => {
    const ok = await confirm({
      title: `Block ${user.firstName}?`,
      message: "They won't be able to see you or message you. You can unblock them in Settings.",
      confirmLabel: "Block",
      danger: true,
    });
    if (ok) block(user._id);
  };

  const applySkills = (value) => {
    if (value !== skills) dispatch(setFeedSkills(value));
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 overflow-x-hidden">
      <SkillsFilter value={skills} onApply={applySkills} />

      {!loaded ? (
        <Loader />
      ) : !top ? (
        <div className="text-center py-16 max-w-sm">
          <h2 className="text-2xl font-bold">You've seen everyone</h2>
          <p className="opacity-70 mt-2">
            {skills ? "No one else matches this filter." : "Check back later for new developers."}
          </p>
          <button className="btn btn-sm mt-4" onClick={() => dispatch(setFeedSkills(skills))}>
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid">
            {/* Next card peeks from behind the top card. */}
            {users[1] && (
              <div className="[grid-area:1/1] scale-95 opacity-60 pointer-events-none" aria-hidden="true">
                <SwipeCard key={users[1]._id} user={users[1]} onSwipe={() => {}} />
              </div>
            )}
            <div className="[grid-area:1/1] z-10">
              <SwipeCard
                key={top._id}
                user={top}
                exitDir={exiting?.id === top._id ? exiting.dir : null}
                onSwipe={doSwipe}
                menu={<CardMenu user={top} onBlock={() => onBlock(top)} />}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <button
              className="btn btn-circle btn-lg btn-outline btn-error text-2xl"
              aria-label="Pass"
              onClick={() => doSwipe("left")}
            >
              ✕
            </button>
            <button
              className="btn btn-circle btn-lg btn-success text-2xl"
              aria-label="Interested"
              onClick={() => doSwipe("right")}
            >
              ♥
            </button>
          </div>
          <p className="text-xs opacity-60">Drag the card, or use ← → keys</p>
        </>
      )}

      <MatchModal user={match} onClose={() => setMatch(null)} />
      {confirmModal}
    </div>
  );
}

export default Feed;
