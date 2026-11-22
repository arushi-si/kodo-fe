import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, Coffee, RotateCw, WifiOff } from "lucide-react";
import { wakeServer } from "../../utils/api";
import { serverWaking } from "../../utils/serverSlice";

// Don't flash the banner for a single quick retry.
const SHOW_AFTER_MS = 1500;

const useOnline = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
};

// Seconds since `since`, ticking every second while `since` is set.
const useElapsed = (since) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [since]);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
};

// Explains what's going on when the backend is unreachable, instead of a bare
// "Something went wrong". Requests keep retrying in the background (see utils/api.js).
function ServerStatus() {
  const dispatch = useDispatch();
  const { status, since } = useSelector((state) => state.server);
  const online = useOnline();
  const elapsedMs = useElapsed(since) * 1000;

  // when the connection comes back (offline -> online), check the server straight away.
  // Only on that transition, so a "down" banner doesn't turn into an endless retry loop.
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current && status !== "up") wakeServer();
    wasOnline.current = online;
  }, [online, status]);

  const retry = () => {
    dispatch(serverWaking());
    wakeServer();
  };

  let banner = null;
  if (!online) {
    banner = {
      key: "offline",
      icon: <WifiOff className="size-5 text-warning" />,
      title: "You're offline",
      body: "Check your internet connection. We'll reconnect automatically.",
    };
  } else if (status === "waking" && elapsedMs >= SHOW_AFTER_MS) {
    banner = {
      key: "waking",
      icon: <Coffee className="size-5 text-accent" />,
      title: `Waking up the server… ${Math.round(elapsedMs / 1000)}s`,
      body: "Kodo's server naps when nobody's around. The first request can take up to a minute. Hang tight, it'll go through on its own.",
      progress: true,
    };
  } else if (status === "down") {
    banner = {
      key: "down",
      icon: <CloudOff className="size-5 text-error" />,
      title: "Couldn't reach the server",
      body: "It might still be starting up, or something's wrong on our side.",
      action: { label: "Try again", onClick: retry },
    };
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[80] mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.key}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="status"
            className="pointer-events-auto overflow-hidden rounded-3xl bg-base-300/95 backdrop-blur border border-white/10 shadow-2xl"
          >
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 shrink-0">{banner.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{banner.title}</p>
                <p className="mt-1 text-xs text-base-content/70 leading-relaxed">{banner.body}</p>
              </div>
              {banner.action && (
                <button className="btn btn-primary btn-sm rounded-full shrink-0" onClick={banner.action.onClick}>
                  <RotateCw className="size-4" />
                  {banner.action.label}
                </button>
              )}
            </div>
            {banner.progress && (
              <div className="h-1 bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#FF8A3D] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${Math.min(95, (elapsedMs / 60000) * 100)}%` }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServerStatus;
