import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileSheet from "../components/feed/ProfileSheet";
import Logo from "../components/ui/Logo";
import useMeta from "../hooks/useMeta";
import useLogout from "../hooks/useLogout";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { ONBOARDING_STEPS as STEPS } from "../onboarding/steps";

const PREVIEW = STEPS.length - 1;
const storageKey = (userId) => `kodo.onboarding.${userId}`;

const readSavedStep = (userId) => {
  try {
    const n = Number(localStorage.getItem(storageKey(userId)));
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};
const saveStep = (userId, index) => {
  try {
    localStorage.setItem(storageKey(userId), String(index));
  } catch {
    // storage unavailable: resuming falls back to the first unanswered question
  }
};

// Resume at the furthest step reached on this device, but never past a required question
// that still has no answer. On a new device, start at the first unanswered required question.
const resumeIndex = (user, meta) => {
  const missing = STEPS.findIndex((s) => !s.optional && s.done && !s.done(user, meta));
  const saved = readSavedStep(user._id);
  // Brand-new account (only the signup name so far): start at the name step to add a last name.
  const start = saved ?? (missing === -1 ? PREVIEW : missing <= 1 ? 0 : missing);
  return Math.min(start, missing === -1 ? PREVIEW : missing, PREVIEW);
};

function StepScreen({ step, index, user, meta, onNext, onSkip, saving, error }) {
  const [draft, setDraft] = useState(() => step.init(user));
  const [sheetOpen, setSheetOpen] = useState(false);
  const result = step.validate(draft, { user, meta });
  const valid = result === true;
  const message = typeof result === "string" && draft !== null ? result : null;
  const isPreview = index === PREVIEW;

  const submit = (e) => {
    e.preventDefault();
    if (valid && !saving) onNext(step, draft);
  };

  return (
    <>
    <form onSubmit={submit} className="flex-1 flex flex-col">
      <div className="flex-1 px-6 pt-6 pb-8">
        <p className="font-mono text-xs text-accent">{`// step ${index + 1} of ${STEPS.length}`}</p>
        <h1 className="mt-2 text-[2.5rem] leading-[1.05] font-bold">{step.title}</h1>
        {step.subtitle && <p className="mt-3 text-lg text-muted">{step.subtitle}</p>}
        <div className="mt-8">
          {isPreview ? (
            <div className="h-[min(520px,56dvh)]">
              <ProfileCard user={user} onOpen={() => setSheetOpen(true)} />
            </div>
          ) : (
            <step.Field value={draft} onChange={setDraft} meta={meta} user={user} />
          )}
        </div>
        {message && <p className="mt-3 text-sm text-error">{message}</p>}
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-base-100 via-base-100 to-base-100/0 px-6 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col gap-2">
        <button type="submit" className="btn btn-brand btn-lg h-14 w-full text-lg" disabled={!valid || saving}>
          {saving && <span className="loading loading-spinner loading-sm" />}
          {isPreview ? "Start swiping" : "Next"}
        </button>
        {step.optional && (
          <button type="button" className="btn btn-ghost h-12 w-full text-muted" onClick={onSkip} disabled={saving}>
            Skip for now
          </button>
        )}
      </div>
    </form>
    {isPreview && <ProfileSheet user={sheetOpen ? user : null} onClose={() => setSheetOpen(false)} />}
    </>
  );
}

function Onboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logOut = useLogout();
  const user = useSelector((state) => state.user);
  const { meta, status, retry } = useMeta();
  const [index, setIndex] = useState(null);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!meta) {
    return (
      <div className="min-h-dvh grid place-items-center px-6 text-center">
        {status === "failed" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted">Couldn't load the onboarding questions.</p>
            <button className="btn bg-neutral border-0" onClick={retry}>
              Try again
            </button>
          </div>
        ) : (
          <span className="loading loading-dots loading-lg text-primary" />
        )}
      </div>
    );
  }

  const current = index ?? resumeIndex(user, meta);
  const step = STEPS[current];

  const go = (to) => {
    setError(null);
    setDirection(to > current ? 1 : -1);
    setIndex(to);
    if (to > (readSavedStep(user._id) ?? 0)) saveStep(user._id, to);
    window.scrollTo(0, 0);
  };

  const next = async (s, draft) => {
    const patch = current === PREVIEW ? { onboardingCompleted: true } : s.toPatch?.(draft);
    if (patch) {
      setSaving(true);
      try {
        const res = await api.patch("/profile", patch);
        dispatch(addUser(res.data.data));
      } catch (err) {
        setError(getErrorMessage(err));
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    if (current === PREVIEW) {
      try {
        localStorage.removeItem(storageKey(user._id));
      } catch {
        // ignore
      }
      navigate("/feed", { replace: true });
      return;
    }
    go(current + 1);
  };

  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 bg-base-100 pt-safe">
        <div className="flex items-center gap-2 px-3 h-14">
          {current > 0 ? (
            <button className="btn btn-ghost btn-circle" aria-label="Back" onClick={() => go(current - 1)}>
              <ChevronLeft className="size-6" />
            </button>
          ) : (
            <span className="size-11" />
          )}
          <div className="flex-1 flex justify-center">
            <Logo size="sm" />
          </div>
          {current === 0 ? (
            <button className="btn btn-ghost btn-sm h-11 text-muted" onClick={logOut}>
              Log out
            </button>
          ) : (
            <span className="size-11" />
          )}
        </div>
        <div
          className="h-1 bg-base-300"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={current + 1}
          aria-label="Onboarding progress"
        >
          <motion.div className="h-full bg-brand" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-x-clip">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step.id}
            className="flex-1 flex flex-col"
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2 }}
          >
            <StepScreen
              step={step}
              index={current}
              user={user}
              meta={meta}
              saving={saving}
              error={error}
              onNext={next}
              onSkip={() => go(current + 1)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Onboarding;
