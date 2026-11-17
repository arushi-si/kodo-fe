import { useState } from "react";
import { useSelector } from "react-redux";
import { ChevronUp, MapPin } from "lucide-react";
import { DemoBadge, SkillChip } from "./Chips";
import { photoUrls, sharedSkills } from "../../utils/helpers";

// Photo-first card. Tap the left / right half of the photo to move through the carousel
// (story-style progress segments at the top); tap the info area to open the full profile.
// `isDragging()` lets the swipe deck suppress the click that follows a drag.
function ProfileCard({ user, onOpen, isDragging, overlay, className = "" }) {
  const me = useSelector((state) => state.user);
  const photos = photoUrls(user);
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(photos.length - 1, 0));
  const shared = sharedSkills(me, user);
  const sharedSet = new Set(shared.map((s) => s.toLowerCase()));

  const onPhotoClick = (e) => {
    if (isDragging?.()) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const next = e.clientX - left < width / 2 ? current - 1 : current + 1;
    setIndex(Math.min(Math.max(next, 0), photos.length - 1));
  };

  const open = () => {
    if (!isDragging?.()) onOpen?.(user);
  };

  return (
    <article
      className={`relative h-full w-full overflow-hidden rounded-3xl bg-base-300 shadow-2xl select-none ${className}`}
      aria-label={`${user.firstName}${user.age ? `, ${user.age}` : ""}`}
    >
      {photos.map((url, i) => (
        <img
          key={url}
          src={url}
          alt=""
          draggable={false}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* tap zones for the carousel (top 60% of the card) */}
      {photos.length > 1 && (
        <button
          type="button"
          className="absolute inset-x-0 top-0 h-3/5 z-10 cursor-pointer"
          aria-label={`Photo ${current + 1} of ${photos.length}. Tap left or right to change.`}
          onClick={onPhotoClick}
        />
      )}

      {photos.length > 1 && (
        <div className="absolute top-3 inset-x-3 z-20 flex gap-1.5 pointer-events-none">
          {photos.map((url, i) => (
            <span
              key={url}
              className={`h-1 flex-1 rounded-full ${i === current ? "bg-white" : "bg-white/35"}`}
            />
          ))}
        </div>
      )}

      {user.isDemo && <DemoBadge className="absolute top-6 left-4 z-20" />}

      {overlay}

      {/* info over a gradient scrim */}
      <button
        type="button"
        onClick={open}
        className="absolute inset-x-0 bottom-0 z-10 text-left pt-28 pb-5 px-5 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-white"
        aria-label={`Open ${user.firstName}'s full profile`}
      >
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[2rem] leading-tight font-bold truncate">
              {user.firstName}
              {user.age && <span className="font-normal text-white/80">, {user.age}</span>}
            </h2>
            {user.headline && <p className="text-[15px] font-medium text-white/90 line-clamp-2">{user.headline}</p>}
            {user.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                <MapPin className="size-3.5" /> {user.location}
              </p>
            )}
          </div>
          {onOpen && (
            <span className="mb-1 size-10 shrink-0 rounded-full bg-white/15 backdrop-blur grid place-items-center">
              <ChevronUp className="size-5" />
            </span>
          )}
        </div>
        {user.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.skills.slice(0, 4).map((s) => (
              <SkillChip key={s} shared={sharedSet.has(s.toLowerCase())}>
                {s}
              </SkillChip>
            ))}
          </div>
        )}
        {shared.length > 0 && (
          <p className="mt-2 font-mono text-xs text-accent">
            {`// ${shared.length} shared skill${shared.length > 1 ? "s" : ""}`}
          </p>
        )}
      </button>
    </article>
  );
}

export default ProfileCard;
