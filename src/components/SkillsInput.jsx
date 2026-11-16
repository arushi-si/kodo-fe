import { useState } from "react";
import { LIMITS } from "../utils/constant";

// Tag input: Enter or comma adds a skill, Backspace on an empty field removes the last one.
function SkillsInput({ value = [], onChange, max = LIMITS.skillsMax, placeholder = "Add a skill" }) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  const add = () => {
    const skill = draft.trim().slice(0, LIMITS.skillMax);
    setDraft("");
    if (!skill || full) return;
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    onChange([...value, skill]);
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
    <div className="flex flex-wrap gap-2 items-center input w-full h-auto min-h-10 py-2">
      {value.map((skill) => (
        <span key={skill} className="badge badge-primary gap-1">
          {skill}
          <button
            type="button"
            aria-label={`Remove ${skill}`}
            onClick={() => onChange(value.filter((s) => s !== skill))}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24"
        value={draft}
        maxLength={LIMITS.skillMax}
        disabled={full}
        placeholder={full ? `Max ${max} skills` : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </div>
  );
}

export default SkillsInput;
