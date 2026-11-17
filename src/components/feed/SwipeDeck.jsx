import { useEffect, useImperativeHandle, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import ProfileCard from "../profile/ProfileCard";
import { SWIPE_THRESHOLD } from "../../utils/constant";

const SPRING = { type: "spring", stiffness: 420, damping: 32 };
const FLING_VELOCITY = 700;

function Stamp({ label, opacity, className }) {
  return (
    <motion.span
      style={{ opacity }}
      className={`absolute top-14 z-30 pointer-events-none rounded-xl border-[5px] px-3 py-0.5 font-display text-4xl font-bold tracking-wider bg-black/20 backdrop-blur-[2px] ${className}`}
    >
      {label}
    </motion.span>
  );
}

// The draggable top card. `ref.fly(dir)` animates it off-screen (buttons / keyboard);
// releasing a drag past the threshold does the same. Either way `onSwipe(dir)` runs afterwards.
// Dragging up opens the full profile. `enterFrom` (-1 | 1) slides a rewound card back in.
function TopCard({ ref, user, onSwipe, onOpen, enterFrom }) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(enterFrom && !reduceMotion ? enterFrom * 480 : 0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [16, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, -16], [1, 0]);
  const dragged = useRef(false);
  const flying = useRef(false);

  useEffect(() => {
    if (x.get() !== 0) animate(x, 0, SPRING);
  }, [x]);

  const fly = async (dir) => {
    if (flying.current) return;
    flying.current = true;
    const distance = (window.innerWidth / 2 + 520) * (dir === "right" ? 1 : -1);
    const duration = reduceMotion ? 0 : 0.3;
    await Promise.all([
      animate(x, distance, { duration, ease: "easeIn" }),
      animate(y, y.get() + 30, { duration, ease: "easeIn" }),
    ]);
    onSwipe(dir);
  };

  useImperativeHandle(ref, () => ({ fly }));

  const onDragEnd = (_, { offset, velocity }) => {
    setTimeout(() => (dragged.current = false), 60); // swallow the click that follows a drag
    if (offset.x > SWIPE_THRESHOLD || velocity.x > FLING_VELOCITY) return fly("right");
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -FLING_VELOCITY) return fly("left");
    if (offset.y < -90 && Math.abs(offset.x) < 70) onOpen(user);
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  };

  return (
    <motion.div
      className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, y, rotate }}
      drag
      dragMomentum={false}
      dragElastic={0.9}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <ProfileCard
        user={user}
        onOpen={onOpen}
        isDragging={() => dragged.current}
        overlay={
          <>
            <Stamp label="LIKE" opacity={likeOpacity} className="left-5 -rotate-12 border-primary text-primary" />
            <Stamp label="NOPE" opacity={nopeOpacity} className="right-5 rotate-12 border-error text-error" />
          </>
        }
      />
    </motion.div>
  );
}

// Card stack: the next card peeks from behind the draggable top card.
function SwipeDeck({ ref, users, onSwipe, onOpen, returning }) {
  const [top, next] = users;
  if (!top) return null;
  return (
    <div className="relative size-full">
      {next && (
        <div
          key={next._id}
          className="absolute inset-0 scale-[0.94] translate-y-3 opacity-60 pointer-events-none"
          aria-hidden="true"
        >
          <ProfileCard user={next} />
        </div>
      )}
      <TopCard
        key={top._id}
        ref={ref}
        user={top}
        onSwipe={onSwipe}
        onOpen={onOpen}
        enterFrom={returning?.id === top._id ? returning.from : 0}
      />
    </div>
  );
}

export default SwipeDeck;
