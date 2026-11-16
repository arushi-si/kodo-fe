import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Loader from "./Loader";
import useUserActions from "../hooks/useUserActions";
import useConfirm from "../hooks/useConfirm";
import api, { getErrorMessage } from "../utils/api";
import { setConnections } from "../utils/connectionsSlice";
import { showToast } from "../utils/toastSlice";
import { fullName } from "../utils/helpers";

function Connections() {
  const dispatch = useDispatch();
  const { users, loaded } = useSelector((state) => state.connections);
  const { unmatch, block } = useUserActions();
  const [confirm, confirmModal] = useConfirm();

  useEffect(() => {
    api
      .get("/user/connections")
      .then((res) => dispatch(setConnections(res.data)))
      .catch((err) => dispatch(showToast("error", getErrorMessage(err))));
  }, [dispatch]);

  const onUnmatch = async (user) => {
    const ok = await confirm({
      title: `Unmatch ${user.firstName}?`,
      message: "You'll be removed from each other's connections and your chat will close.",
      confirmLabel: "Unmatch",
      danger: true,
    });
    if (ok) unmatch(user._id);
  };

  const onBlock = async (user) => {
    const ok = await confirm({
      title: `Block ${user.firstName}?`,
      message: "They won't be able to see you or message you. You can unblock them in Settings.",
      confirmLabel: "Block",
      danger: true,
    });
    if (ok) block(user._id);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Connections</h1>
      {!loaded ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="text-center opacity-70 py-12">
          <p>No connections yet.</p>
          <Link to="/feed" className="btn btn-primary btn-sm mt-4">
            Start swiping
          </Link>
        </div>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
          {users.map((user) => (
            <li key={user._id} className="list-row items-center">
              <Link to={`/user/${user._id}`}>
                <Avatar user={user} size="md" />
              </Link>
              <div className="min-w-0 list-col-grow">
                <Link to={`/user/${user._id}`} className="font-semibold link link-hover">
                  {fullName(user)}
                </Link>
                {user.headline && <div className="text-sm opacity-70 truncate">{user.headline}</div>}
              </div>
              <Link to={`/chat/${user._id}`} className="btn btn-sm btn-primary">
                Message
              </Link>
              <div className="dropdown dropdown-end">
                <button tabIndex={0} className="btn btn-sm btn-ghost" aria-label="More actions">
                  ⋯
                </button>
                <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow">
                  <li>
                    <Link to={`/user/${user._id}`}>View profile</Link>
                  </li>
                  <li>
                    <button onClick={() => onUnmatch(user)}>Unmatch</button>
                  </li>
                  <li>
                    <button className="text-error" onClick={() => onBlock(user)}>
                      Block
                    </button>
                  </li>
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirmModal}
    </div>
  );
}

export default Connections;
