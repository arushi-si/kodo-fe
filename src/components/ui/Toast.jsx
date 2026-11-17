import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { dismissToast } from "../../utils/toastSlice";

const ICONS = {
  success: <Check className="size-4 text-success" />,
  error: <CircleAlert className="size-4 text-error" />,
  info: <Info className="size-4 text-info" />,
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 3500);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      role="status"
      className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-base-300/95 backdrop-blur border border-white/10 px-4 py-3 shadow-xl"
    >
      {ICONS[toast.type] ?? ICONS.info}
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        className="btn btn-ghost btn-circle btn-sm -mr-2"
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

// Global toasts at the top of the app column.
function Toast() {
  const toasts = useSelector((state) => state.toast);
  return (
    <div className="fixed top-0 inset-x-0 z-[70] mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
