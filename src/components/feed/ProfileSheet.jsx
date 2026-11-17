import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FullProfile from "../profile/FullProfile";

// Full profile sliding up over the current screen. `actions` render in a sticky bottom bar.
function ProfileSheet({ user, onClose, actions }) {
  useEffect(() => {
    if (!user) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onClose]);

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          key={user._id}
          role="dialog"
          aria-modal="true"
          aria-label={`${user.firstName}'s profile`}
          className="fixed inset-0 z-50 mx-auto max-w-md bg-base-100 overflow-y-auto overscroll-contain"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
        >
          <div className="sticky top-0 z-10 flex justify-end px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pointer-events-none">
            <button
              type="button"
              className="btn btn-circle bg-base-300/90 backdrop-blur border-0 pointer-events-auto"
              aria-label="Close profile"
              onClick={onClose}
              autoFocus
            >
              <ChevronDown className="size-6" />
            </button>
          </div>
          <div className="px-4 pb-8">
            <FullProfile user={user} />
          </div>
          {actions && (
            <div className="sticky bottom-0 bg-gradient-to-t from-base-100 via-base-100/95 to-transparent pt-6 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {actions}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProfileSheet;
