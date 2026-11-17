// Friendly empty state: an icon in a glowing tile, a code-comment kicker, a title and an action.
function EmptyState({ icon, comment, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14 gap-3">
      {icon && (
        <div className="size-20 rounded-3xl bg-base-200 border border-white/5 grid place-items-center text-primary mb-2">
          {icon}
        </div>
      )}
      {comment && <p className="font-mono text-xs text-accent">{`// ${comment}`}</p>}
      <h2 className="text-2xl font-bold">{title}</h2>
      {children && <p className="text-muted max-w-xs">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
