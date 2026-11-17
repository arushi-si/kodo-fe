import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const distance = 130 + (i % 4) * 30;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    glyph: ["♥", "</>", "•", "✦"][i % 4],
    color: ["#FF3D7F", "#C6FF3D", "#FF8A3D", "#7C3AED"][i % 4],
    delay: (i % 5) * 0.03,
  };
});

function Burst() {
  return (
    <div className="absolute left-1/2 top-[42%] pointer-events-none" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute font-mono font-bold text-xl -translate-x-1/2 -translate-y-1/2"
          style={{ color: p.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.3, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 1.3, delay: 0.15 + p.delay, ease: "easeOut" }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  );
}

function MatchPhoto({ user, tilt }) {
  return (
    <motion.img
      src={user?.photoUrl}
      alt={user?.firstName}
      initial={{ rotate: 0, scale: 0.6, opacity: 0, x: tilt > 0 ? 60 : -60 }}
      animate={{ rotate: tilt, scale: 1, opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
      className="w-36 aspect-[3/4] object-cover rounded-3xl ring-4 ring-base-100 bg-base-300 shadow-glow"
    />
  );
}

// The "It's a match" moment: both photos, the brand gradient, a burst and two choices.
function MatchModal({ user, onClose }) {
  const me = useSelector((state) => state.user);
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {user && (
        <motion.div
          key={user._id}
          role="dialog"
          aria-modal="true"
          aria-label={`It's a match with ${user.firstName}`}
          className="fixed inset-0 z-[60] mx-auto max-w-md overflow-hidden bg-base-100/95 backdrop-blur-lg flex flex-col items-center justify-center px-6 pt-safe pb-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-brand opacity-20 blur-3xl scale-150 pointer-events-none" />
          {!reduceMotion && <Burst />}
          <p className="relative font-mono text-sm text-accent">{"// git merge --no-conflicts"}</p>
          <motion.h2
            className="relative mt-2 text-5xl font-bold text-brand text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            It's a match!
          </motion.h2>
          <p className="relative mt-3 text-center text-muted">
            You and {user.firstName} both swiped right.
          </p>

          <div className="relative my-10 flex items-center">
            <MatchPhoto user={me} tilt={-8} />
            <span className="relative z-10 -mx-5 size-14 rounded-full bg-brand grid place-items-center shadow-glow ring-4 ring-base-100">
              <Heart className="size-7 text-white" fill="currentColor" />
            </span>
            <MatchPhoto user={user} tilt={8} />
          </div>

          <div className="relative w-full flex flex-col gap-3">
            <Link to={`/chat/${user._id}`} className="btn btn-brand btn-lg w-full h-14" onClick={onClose}>
              Send a message
            </Link>
            <button className="btn btn-ghost btn-lg w-full h-14" onClick={onClose} autoFocus>
              Keep swiping
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MatchModal;
