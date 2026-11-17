import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { Compass, Heart, MessageCircle, User } from "lucide-react";
import { selectUnreadTotal } from "../../utils/chatSlice";

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-content text-[11px] font-bold grid place-items-center ring-2 ring-base-200">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Tab({ to, label, icon: Icon, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium transition-colors ${
          isActive ? "text-primary" : "text-muted hover:text-base-content"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} fill={isActive && Icon === Heart ? "currentColor" : "none"} />
            <Badge count={count} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

// Fixed bottom navigation for the logged-in tabs, inside the centered app column.
function TabBar() {
  const likes = useSelector((state) => state.requests.received.length);
  const unread = useSelector(selectUnreadTotal);
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md bg-base-200/90 backdrop-blur-md border-t border-white/5 pb-safe"
    >
      <div className="flex">
        <Tab to="/feed" label="Discover" icon={Compass} />
        <Tab to="/likes" label="Likes" icon={Heart} count={likes} />
        <Tab to="/chats" label="Chats" icon={MessageCircle} count={unread} />
        <Tab to="/profile" label="Profile" icon={User} />
      </div>
    </nav>
  );
}

export default TabBar;
