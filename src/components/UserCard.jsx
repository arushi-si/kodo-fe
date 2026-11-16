import { initials, fullName } from "../utils/helpers";

// Display-only profile card. `actions` renders in the footer, `menu` in the top-right corner.
function UserCard({ user, actions, menu, className = "" }) {
  const name = fullName(user);
  return (
    <div className={`card bg-base-100 w-80 sm:w-96 shadow-md select-none ${className}`}>
      <figure className="relative h-72 bg-base-300">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt={name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="avatar avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-24 rounded-full">
              <span className="text-3xl">{initials(user)}</span>
            </div>
          </div>
        )}
        {menu && <div className="absolute top-2 right-2">{menu}</div>}
      </figure>
      <div className="card-body gap-2">
        <h2 className="card-title flex-wrap">
          {name}
          {user.age && <span className="font-normal opacity-70">{user.age}</span>}
          {user.experienceLevel && <span className="badge badge-outline badge-sm">{user.experienceLevel}</span>}
        </h2>
        {user.headline && <p className="font-medium">{user.headline}</p>}
        {(user.location || user.gender) && (
          <p className="text-sm opacity-70">{[user.location, user.gender].filter(Boolean).join(" · ")}</p>
        )}
        <p className="text-sm line-clamp-4 whitespace-pre-line">{user.about || "No description available."}</p>
        {user.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.skills.map((skill) => (
              <span key={skill} className="badge badge-soft badge-primary badge-sm">
                {skill}
              </span>
            ))}
          </div>
        )}
        {user.githubUrl && (
          <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
            GitHub ↗
          </a>
        )}
        {actions && <div className="card-actions justify-center mt-2">{actions}</div>}
      </div>
    </div>
  );
}

export default UserCard;
