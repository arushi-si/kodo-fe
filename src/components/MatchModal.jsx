import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "./Avatar";

function MatchModal({ user, onClose }) {
  const me = useSelector((state) => state.user);
  if (!user) return null;
  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box text-center">
        <h3 className="text-3xl font-black text-primary">It's a match!</h3>
        <p className="py-2">You and {user.firstName} are now connected.</p>
        <div className="flex justify-center gap-4 py-4">
          <Avatar user={me} size="lg" />
          <Avatar user={user} size="lg" />
        </div>
        <div className="modal-action justify-center">
          <button className="btn" onClick={onClose} autoFocus>
            Keep swiping
          </button>
          <Link to={`/chat/${user._id}`} className="btn btn-primary" onClick={onClose}>
            Send a message
          </Link>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default MatchModal;
