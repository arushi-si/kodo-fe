import { useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { TextArea } from "./inputs";

function QuestionPicker({ questions, onPick, onCancel }) {
  return (
    <div className="rounded-3xl bg-base-200 border border-white/5 p-2">
      <p className="px-3 pt-2 pb-1 font-mono text-xs text-muted">{"// pick a prompt"}</p>
      <ul>
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              className="w-full flex items-center gap-2 text-left rounded-2xl px-3 py-3 min-h-12 hover:bg-base-300"
              onClick={() => onPick(q)}
            >
              <span className="flex-1">{q}</span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          </li>
        ))}
      </ul>
      {onCancel && (
        <button type="button" className="btn btn-ghost btn-sm w-full mt-1" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

// Pick up to `limits.prompts` questions from /meta and answer each (max `limits.promptAnswer`).
// value: [{ question, answer }]
function PromptsEditor({ value, onChange, meta }) {
  const { prompts: max, promptAnswer } = meta.limits;
  const [picking, setPicking] = useState(value.length === 0 ? "new" : null); // "new" | index | null
  const used = new Set(value.map((p) => p.question));
  const available = meta.promptQuestions.filter((q) => !used.has(q));

  const pick = (question) => {
    if (picking === "new") onChange([...value, { question, answer: "" }]);
    else onChange(value.map((p, i) => (i === picking ? { ...p, question } : p)));
    setPicking(null);
  };

  const setAnswer = (index, answer) => onChange(value.map((p, i) => (i === index ? { ...p, answer } : p)));
  const remove = (index) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-4">
      {value.map((prompt, i) =>
        picking === i ? (
          <QuestionPicker key={prompt.question} questions={available} onPick={pick} onCancel={() => setPicking(null)} />
        ) : (
          <div key={prompt.question} className="rounded-3xl bg-base-200 border border-white/5 p-4">
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="flex-1 text-left font-mono text-[13px] text-muted hover:text-base-content min-h-11"
                onClick={() => setPicking(i)}
                aria-label={`Change question: ${prompt.question}`}
              >
                {`// ${prompt.question}`}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm size-11 -mr-2 -mt-2"
                aria-label="Remove prompt"
                onClick={() => remove(i)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <TextArea
              value={prompt.answer}
              maxLength={promptAnswer}
              rows={3}
              placeholder="Your answer"
              aria-label={`Answer to: ${prompt.question}`}
              autoFocus={!prompt.answer}
              onChange={(e) => setAnswer(i, e.target.value)}
            />
          </div>
        ),
      )}

      {picking === "new" && available.length > 0 && (
        <QuestionPicker
          questions={available}
          onPick={pick}
          onCancel={value.length ? () => setPicking(null) : undefined}
        />
      )}

      {picking === null && value.length < max && (
        <button
          type="button"
          className="h-14 rounded-2xl border-2 border-dashed border-white/15 text-muted hover:text-primary hover:border-primary flex items-center justify-center gap-2"
          onClick={() => setPicking("new")}
        >
          <Plus className="size-5" /> Add a prompt ({value.length}/{max})
        </button>
      )}
    </div>
  );
}

export default PromptsEditor;
