// Small pills used across profiles.

// Skill chips: acid-lime "code-ish" accent.
export function SkillChip({ children, shared = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs border ${
        shared ? "bg-accent text-accent-content border-accent" : "bg-accent/10 text-accent border-accent/25"
      }`}
    >
      {children}
    </span>
  );
}

export function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral px-2.5 py-0.5 font-mono text-[11px] text-muted">
      #{children}
    </span>
  );
}

export function DemoBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-black/45 backdrop-blur px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/85 border border-white/15 ${className}`}
      title="A demo profile seeded to show how the app works"
    >
      Demo
    </span>
  );
}
