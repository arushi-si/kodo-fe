function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
      <div className="modal-box bg-base-200 rounded-t-3xl sm:rounded-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))] mx-auto max-w-md">
        <h3 className="text-xl font-bold">{title}</h3>
        {message && <p className="py-3 text-muted">{message}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn flex-1 ${danger ? "btn-error" : "btn-brand"}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={onCancel} />
    </div>
  );
}

export default ConfirmModal;
