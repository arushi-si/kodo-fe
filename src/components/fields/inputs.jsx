import { useState } from "react";
import { Plus, X } from "lucide-react";

// Basic form controls shared by onboarding and the edit-profile sections.

export function Label({ children, hint }) {
  return (
    <span className="flex items-baseline justify-between mb-2">
      <span className="text-sm font-medium text-muted">{children}</span>
      {hint && <span className="font-mono text-xs text-muted">{hint}</span>}
    </span>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-error">{children}</p>;
}

const inputClass =
  "input w-full h-14 rounded-2xl bg-neutral border-0 px-4 text-lg focus-within:outline-2 focus-within:outline-primary";

export function TextInput({ label, hint, error, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <Label hint={hint}>{label}</Label>}
      <input className={inputClass} {...props} />
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function TextArea({ label, value, maxLength, error, rows = 4, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <Label hint={maxLength && `${value.length}/${maxLength}`}>{label}</Label>}
      <textarea
        className="textarea w-full rounded-2xl bg-neutral border-0 p-4 text-lg leading-relaxed focus:outline-2 focus:outline-primary"
        rows={rows}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      {!label && maxLength && (
        <p className="mt-1 text-right font-mono text-xs text-muted">
          {value.length}/{maxLength}
        </p>
      )}
      <FieldError>{error}</FieldError>
    </label>
  );
}

// Large single-choice pills (gender, experience level).
export function ChoicePills({ options, value, onChange, label: optionLabel = (o) => o, columns = 1 }) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`} role="radiogroup">
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : option)}
            className={`h-14 rounded-2xl px-5 text-left text-lg font-medium border transition-colors ${
              selected
                ? "bg-primary/15 border-primary text-base-content"
                : "bg-base-200 border-white/5 text-base-content/85 hover:border-white/20"
            }`}
          >
            {optionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

// Tag input: Enter, comma or the + button adds; × removes. Used for skills and project tags.
export function ChipInput({ value = [], onChange, max, maxLength, placeholder = "Add", mono = true }) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  const add = () => {
    const item = draft.trim().slice(0, maxLength);
    setDraft("");
    if (!item || full) return;
    if (value.some((s) => s.toLowerCase() === item.toLowerCase())) return;
    onChange([...value, item]);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="input flex-1 h-12 rounded-full bg-neutral border-0 px-4"
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={full ? `That's the max (${max})` : placeholder}
          enterKeyHint="done"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
        />
        <button
          type="button"
          className="btn btn-circle size-12 bg-neutral border-0"
          aria-label="Add"
          disabled={full || !draft.trim()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={add}
        >
          <Plus className="size-5" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/25 pl-3 pr-1 h-9 text-sm ${
                mono ? "font-mono" : ""
              }`}
            >
              {item}
              <button
                type="button"
                className="size-7 rounded-full grid place-items-center hover:bg-accent/20"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(value.filter((s) => s !== item))}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="font-mono text-xs text-muted">
        {value.length}/{max}
      </p>
    </div>
  );
}
