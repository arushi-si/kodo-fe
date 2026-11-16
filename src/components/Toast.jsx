import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast } from "../utils/toastSlice";

const ALERT_CLASS = { success: "alert-success", error: "alert-error", info: "alert-info" };

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 3500);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div role="status" className={`alert ${ALERT_CLASS[toast.type] ?? ""}`}>
      <span>{toast.message}</span>
      <button className="btn btn-ghost btn-xs" onClick={() => dispatch(dismissToast(toast.id))}>
        ✕
      </button>
    </div>
  );
}

function Toast() {
  const toasts = useSelector((state) => state.toast);
  if (!toasts.length) return null;
  return (
    <div className="toast toast-top toast-end z-50 mt-14">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default Toast;
