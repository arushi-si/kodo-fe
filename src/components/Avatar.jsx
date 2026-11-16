import { fullName, initials } from "../utils/helpers";

const SIZES = { xs: "w-8", sm: "w-10", md: "w-14", lg: "w-24" };

function Avatar({ user, size = "sm" }) {
  const width = SIZES[size] ?? SIZES.sm;
  if (user?.photoUrl) {
    return (
      <div className="avatar">
        <div className={`${width} rounded-full`}>
          <img src={user.photoUrl} alt={fullName(user)} />
        </div>
      </div>
    );
  }
  return (
    <div className="avatar avatar-placeholder">
      <div className={`bg-neutral text-neutral-content ${width} rounded-full`}>
        <span>{initials(user)}</span>
      </div>
    </div>
  );
}

export default Avatar;
