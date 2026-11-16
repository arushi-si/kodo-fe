import { useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import Avatar from "./Avatar";
import useLogout from "../hooks/useLogout";
import { APP_NAME } from "../utils/constant";

function NavItems({ receivedCount }) {
  const linkClass = ({ isActive }) => (isActive ? "menu-active" : "");
  return (
    <>
      <li>
        <NavLink to="/feed" className={linkClass}>
          Feed
        </NavLink>
      </li>
      <li>
        <NavLink to="/requests" className={linkClass}>
          Requests
          {receivedCount > 0 && <span className="badge badge-sm badge-secondary">{receivedCount}</span>}
        </NavLink>
      </li>
      <li>
        <NavLink to="/connections" className={linkClass}>
          Connections
        </NavLink>
      </li>
    </>
  );
}

function Navbar() {
  const user = useSelector((state) => state.user);
  const receivedCount = useSelector((state) => state.requests.received.length);
  const logOut = useLogout();

  return (
    <div className="navbar bg-base-200 shadow-sm sticky top-0 z-40">
      <div className="flex-1">
        <Link to={user ? "/feed" : "/login"} className="btn btn-ghost text-xl">
          {APP_NAME}
        </Link>
      </div>
      {user && (
        <div className="flex gap-2 items-center">
          <ul className="menu menu-horizontal px-1 hidden md:flex">
            <NavItems receivedCount={receivedCount} />
          </ul>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle" aria-label="Account menu">
              <Avatar user={user} size="xs" />
            </div>
            <ul
              tabIndex="-1"
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
            >
              <div className="md:hidden">
                <NavItems receivedCount={receivedCount} />
                <li className="menu-title" />
              </div>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
              <li>
                <button onClick={logOut}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;
