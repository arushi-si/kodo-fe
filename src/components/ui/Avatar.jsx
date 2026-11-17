import { fullName, initials } from "../../utils/helpers";

const SIZES = { xs: "size-8 text-xs", sm: "size-11 text-sm", md: "size-14", lg: "size-20 text-xl", xl: "size-28 text-3xl" };

// `ring` draws the brand-gradient ring used for new matches.
function Avatar({ user, size = "sm", ring = false, className = "" }) {
  const dims = SIZES[size] ?? SIZES.sm;
  const inner = user?.photoUrl ? (
    <img src={user.photoUrl} alt={fullName(user)} className="size-full object-cover" draggable={false} />
  ) : (
    <span className="font-display font-semibold">{initials(user)}</span>
  );
  return (
    <span
      className={`${dims} shrink-0 inline-grid place-items-center rounded-full ${ring ? "bg-brand p-[2px]" : ""} ${className}`}
    >
      <span className="size-full rounded-full overflow-hidden bg-neutral grid place-items-center ring-2 ring-base-100">
        {inner}
      </span>
    </span>
  );
}

export default Avatar;
