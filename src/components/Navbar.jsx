import { useSelector } from "react-redux";

function Navbar() {
  const user = useSelector((state) => state.user);
  const profileImage = user?.profileImage;

  return (
    <div className="navbar bg-base-200 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">daisyUI</a>
      </div>
      <div className="flex gap-2">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            {user &&
              (profileImage ? (
                <div className="w-10 rounded-full">
                  <img alt="Tailwind CSS Navbar component" src={profileImage} />
                </div>
              ) : (
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content w-8 rounded-full">
                    <span className="text-xs">
                      {user.firstName.charAt(0) + user.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <ul
            tabIndex="-1"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
