function UserCard({ user }) {
  return (
    <div className="card bg-base-100 w-96 shadow-sm">
      <figure>
        {user.profileImage ? (
          <img
            src={user.profilePicture}
            alt={`${user.firstName} ${user.lastName}`}
          />
        ) : (
          <div className="avatar avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-24 rounded-full">
              <span className="text-3xl">
                {user.firstName.charAt(0) + user.lastName.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {user.firstName} {user.lastName}
        </h2>
        <p>{user.about ? user.about : "No description available."}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">I Like</button>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
