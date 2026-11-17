import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, RefreshCw, SlidersHorizontal, Undo2, X } from "lucide-react";
import SwipeDeck from "../components/feed/SwipeDeck";
import MatchModal from "../components/feed/MatchModal";
import ProfileSheet from "../components/feed/ProfileSheet";
import Logo from "../components/ui/Logo";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";
import useUserActions from "../hooks/useUserActions";
import api, { getErrorMessage } from "../utils/api";
import { appendFeed, removeUserFromFeed, setFeedSkills } from "../utils/feedSlice";
import { showToast } from "../utils/toastSlice";
import { FEED_LIMIT, MIN_FEED_CARDS, UNDO_TOAST_MS } from "../utils/constant";

function SkillsFilter({ value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <form
      className="flex gap-2 px-4 pb-3"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft.split(",").map((s) => s.trim()).filter(Boolean).join(","));
      }}
    >
      <input
        className="input flex-1 bg-neutral border-0 rounded-full"
        placeholder="Filter by skills, e.g. react, node"
        aria-label="Filter by skills"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      {value && (
        <button
          type="button"
          className="btn btn-ghost btn-circle"
          aria-label="Clear filter"
          onClick={() => {
            setDraft("");
            onApply("");
          }}
        >
          <X className="size-5" />
        </button>
      )}
      <button type="submit" className="btn bg-neutral border-0 px-5">
        Apply
      </button>
    </form>
  );
}

function PassToast({ toast, onUndo, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDone, UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="absolute bottom-3 inset-x-3 z-30 flex items-center gap-3 rounded-2xl bg-base-300/95 backdrop-blur border border-white/10 pl-4 pr-2 py-2 shadow-xl"
        >
          <span className="flex-1 text-sm truncate">You passed on {toast.user.firstName}</span>
          <button className="btn btn-sm h-10 bg-neutral border-0 text-accent font-mono" onClick={onUndo}>
            <Undo2 className="size-4" /> Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Feed() {
  const dispatch = useDispatch();
  const { users, skills, exhausted, loaded } = useSelector((state) => state.feed);
  const { swipe, undoLast } = useUserActions();
  const deck = useRef(null);
  const chain = useRef(Promise.resolve()); // swipes are sent in order, so undo always rewinds the latest
  const fetching = useRef(false);
  const [inFlight, setInFlight] = useState(0);
  const [undoStack, setUndoStack] = useState([]); // [{ id, from }] undoable swipes this session
  const [undoing, setUndoing] = useState(false);
  const [returning, setReturning] = useState(null); // { id, from } card sliding back in
  const [passToast, setPassToast] = useState(null);
  const [match, setMatch] = useState(null);
  const [sheetUser, setSheetUser] = useState(null);
  const [showFilter, setShowFilter] = useState(Boolean(skills));

  const top = users[0];

  const fetchFeed = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const params = { page: 1, limit: FEED_LIMIT };
      if (skills) params.skills = skills;
      const res = await api.get("/user/feed", { params });
      dispatch(appendFeed(res.data));
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    } finally {
      fetching.current = false;
    }
  }, [dispatch, skills]);

  // Initial load, and top-ups once every sent swipe is reflected on the server
  // (otherwise page 1 would return the users we just swiped).
  useEffect(() => {
    const needsMore = !loaded || (users.length < MIN_FEED_CARDS && !exhausted);
    if (needsMore && inFlight === 0) fetchFeed();
  }, [loaded, users.length, exhausted, inFlight, fetchFeed]);

  // Runs after the card has flown off.
  const onSwipe = useCallback(
    (dir) => {
      const user = top;
      if (!user) return;
      const status = dir === "right" ? "interested" : "ignored";
      dispatch(removeUserFromFeed(user._id));
      setReturning(null);
      setPassToast(dir === "left" ? { user, key: Date.now() } : null);
      setInFlight((n) => n + 1);
      chain.current = chain.current
        .then(() => swipe(user, status))
        .then((result) => {
          if (result?.matched) setMatch(user);
          else if (result) setUndoStack((s) => [...s, { id: user._id, from: dir === "right" ? 1 : -1 }]);
        })
        .finally(() => setInFlight((n) => n - 1));
    },
    [dispatch, swipe, top],
  );

  const act = useCallback(
    (dir) => {
      setSheetUser(null);
      deck.current?.fly(dir);
    },
    [],
  );

  const undo = useCallback(async () => {
    if (undoing || !undoStack.length) return;
    setUndoing(true);
    setPassToast(null);
    setSheetUser(null);
    await chain.current;
    const last = undoStack[undoStack.length - 1];
    const user = await undoLast();
    setUndoing(false);
    if (user) {
      setReturning({ id: user._id, from: last.from });
      setUndoStack((s) => s.slice(0, -1));
    } else {
      setUndoStack([]);
    }
  }, [undoing, undoStack, undoLast]);

  const canUndo = undoStack.length > 0 && !undoing;

  // Keyboard: ← pass, → like, Backspace / Z undo, ↑ open profile.
  useEffect(() => {
    const onKey = (e) => {
      if (match || e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" && top) act("right");
      else if (e.key === "ArrowLeft" && top) act("left");
      else if (e.key === "ArrowUp" && top && !sheetUser) setSheetUser(top);
      else if (e.key === "Backspace" || e.key === "z" || e.key === "Z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, undo, match, top, sheetUser]);

  const applySkills = (value) => {
    if (value !== skills) dispatch(setFeedSkills(value));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--tabbar-h))] overflow-hidden">
      <header className="pt-safe shrink-0">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo size="md" />
          <button
            className={`btn btn-circle btn-ghost ${skills ? "text-accent" : ""}`}
            aria-label="Filter by skills"
            aria-expanded={showFilter}
            onClick={() => setShowFilter((v) => !v)}
          >
            <SlidersHorizontal className="size-5" />
          </button>
        </div>
        {showFilter && <SkillsFilter value={skills} onApply={applySkills} />}
      </header>

      <div className="relative flex-1 min-h-0 px-3">
        {!loaded ? (
          <CardSkeleton className="size-full" />
        ) : !top ? (
          <div className="size-full rounded-3xl bg-base-200 border border-white/5 grid place-items-center overflow-y-auto">
            <EmptyState
              icon={<RefreshCw className="size-9" />}
              comment="EOF"
              title="You've seen everyone"
              action={
                <div className="flex flex-col gap-2 items-center">
                  <button className="btn btn-brand px-6" onClick={() => dispatch(setFeedSkills(skills))}>
                    Refresh
                  </button>
                  {canUndo && (
                    <button className="btn btn-ghost" onClick={undo}>
                      <Undo2 className="size-4" /> Undo last swipe
                    </button>
                  )}
                  <Link to="/likes?tab=passed" className="btn btn-ghost text-muted">
                    Revisit people you passed
                  </Link>
                </div>
              }
            >
              {skills ? "No one else matches this filter." : "Check back later for new developers."}
            </EmptyState>
          </div>
        ) : (
          <SwipeDeck ref={deck} users={users} onSwipe={onSwipe} onOpen={setSheetUser} returning={returning} />
        )}
        <PassToast toast={passToast} onUndo={undo} onDone={() => setPassToast(null)} />
      </div>

      <div className="shrink-0 flex items-center justify-center gap-5 py-3">
        <button
          className="btn btn-circle size-12 bg-base-200 border border-white/10 text-warning disabled:text-muted/40"
          aria-label="Undo last swipe"
          title="Undo (Z)"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 className="size-5" />
        </button>
        <button
          className="btn btn-circle size-[4.25rem] bg-base-200 border border-white/10 text-error hover:bg-base-300"
          aria-label="Pass"
          title="Pass (←)"
          disabled={!top}
          onClick={() => act("left")}
        >
          <X className="size-8" strokeWidth={3} />
        </button>
        <button
          className="btn btn-circle size-[4.25rem] btn-brand"
          aria-label="Like"
          title="Like (→)"
          disabled={!top}
          onClick={() => act("right")}
        >
          <Heart className="size-8" fill="currentColor" />
        </button>
        {/* spacer keeps Pass / Like centered */}
        <span className="size-12" aria-hidden="true" />
      </div>

      <ProfileSheet
        user={sheetUser}
        onClose={() => setSheetUser(null)}
        actions={
          sheetUser?._id === top?._id && (
            <div className="flex gap-3">
              <button className="btn btn-lg h-14 flex-1 bg-base-200 border border-white/10 text-error" onClick={() => act("left")}>
                <X className="size-6" strokeWidth={3} /> Pass
              </button>
              <button className="btn btn-lg h-14 flex-1 btn-brand" onClick={() => act("right")}>
                <Heart className="size-6" fill="currentColor" /> Like
              </button>
            </div>
          )
        }
      />
      <MatchModal user={match} onClose={() => setMatch(null)} />
    </div>
  );
}

export default Feed;
