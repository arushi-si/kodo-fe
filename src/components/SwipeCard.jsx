import { useRef, useState } from "react";
import UserCard from "./UserCard";
import { SWIPE_THRESHOLD } from "../utils/constant";

// Draggable wrapper around UserCard. Calls onSwipe("left" | "right") when released past
// the threshold. When `exitDir` is set the card flies off in that direction.
function SwipeCard({ user, onSwipe, exitDir, menu }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);

  const onPointerDown = (e) => {
    if (exitDir || e.target.closest("a, button, details, summary")) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_THRESHOLD) onSwipe(dx > 0 ? "right" : "left");
    else setDx(0);
  };

  const x = exitDir ? (exitDir === "right" ? 1 : -1) * window.innerWidth : dx;
  const style = {
    transform: `translateX(${x}px) rotate(${x / 20}deg)`,
    transition: dragging ? "none" : "transform 0.3s ease-out",
    touchAction: "pan-y",
  };
  const likeOpacity = Math.min(Math.max(dx / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dx / SWIPE_THRESHOLD, 0), 1);

  return (
    <div
      className="relative cursor-grab active:cursor-grabbing"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <UserCard user={user} menu={menu} />
      <span
        className="absolute top-8 left-6 -rotate-12 border-4 border-success text-success rounded-lg px-3 text-3xl font-black pointer-events-none"
        style={{ opacity: exitDir === "right" ? 1 : likeOpacity }}
      >
        LIKE
      </span>
      <span
        className="absolute top-8 right-6 rotate-12 border-4 border-error text-error rounded-lg px-3 text-3xl font-black pointer-events-none"
        style={{ opacity: exitDir === "left" ? 1 : nopeOpacity }}
      >
        NOPE
      </span>
    </div>
  );
}

export default SwipeCard;
