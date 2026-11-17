import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import ProjectCard from "../profile/ProjectCard";
import { ChipInput, Label, TextArea, TextInput } from "./inputs";
import { isHttpUrl } from "../../utils/helpers";

const EMPTY = { title: "", description: "", url: "", repoUrl: "", tags: [] };

const validate = (p) => {
  const errors = {};
  if (!p.title.trim()) errors.title = "Give it a title";
  if (!isHttpUrl(p.url.trim())) errors.url = "Must start with http:// or https://";
  if (!isHttpUrl(p.repoUrl.trim())) errors.repoUrl = "Must start with http:// or https://";
  return errors;
};

// Only send fields that have a value; empty strings are dropped.
const clean = (p) => {
  const out = { title: p.title.trim(), tags: p.tags };
  if (p._id) out._id = p._id;
  for (const key of ["description", "url", "repoUrl", "imageUrl"]) {
    const v = p[key]?.trim();
    if (v) out[key] = v;
  }
  return out;
};

function ProjectForm({ initial, limits, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial, tags: initial?.tags ?? [] }));
  const [touched, setTouched] = useState(false);
  const errors = validate(form);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    onSave(clean(form));
  };

  return (
    <div className="rounded-3xl bg-base-200 border border-white/5 p-4 flex flex-col gap-4">
      <p className="font-mono text-xs text-accent">{initial ? "// edit project" : "// new project"}</p>
      <TextInput
        label="Title"
        placeholder="Will you be my Valentine?"
        maxLength={limits.projectTitle}
        value={form.title}
        onChange={set("title")}
        error={touched && errors.title}
        autoFocus
      />
      <TextArea
        label="What does it do?"
        placeholder="A site where the 'No' button runs away from your cursor."
        rows={3}
        maxLength={limits.projectDescription}
        value={form.description}
        onChange={set("description")}
      />
      <TextInput
        label="Live URL"
        type="url"
        inputMode="url"
        placeholder="https://…"
        value={form.url}
        onChange={set("url")}
        error={touched && errors.url}
      />
      <TextInput
        label="Repo URL"
        type="url"
        inputMode="url"
        placeholder="https://github.com/…"
        value={form.repoUrl}
        onChange={set("repoUrl")}
        error={touched && errors.repoUrl}
      />
      <div>
        <Label>Tags</Label>
        <ChipInput
          value={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          max={limits.projectTags}
          maxLength={limits.skill}
          placeholder="react, raspberry-pi…"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn bg-neutral border-0 flex-1" onClick={save}>
          Save project
        </button>
      </div>
    </div>
  );
}

// Hobby projects list (max `limits.projects`). value: Project[]
function ProjectsEditor({ value, onChange, meta }) {
  const { limits } = meta;
  const [editing, setEditing] = useState(null); // "new" | index | null

  const save = (project) => {
    if (editing === "new") onChange([...value, project]);
    else onChange(value.map((p, i) => (i === editing ? project : p)));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.map((project, i) =>
        editing === i ? (
          <ProjectForm key={i} initial={project} limits={limits} onSave={save} onCancel={() => setEditing(null)} />
        ) : (
          <ProjectCard key={project._id ?? `${i}-${project.title}`} project={project}>
            <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
              <button type="button" className="btn btn-ghost btn-sm h-10" onClick={() => setEditing(i)}>
                <Pencil className="size-4" /> Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm h-10 text-error"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" /> Remove
              </button>
            </div>
          </ProjectCard>
        ),
      )}
      {editing === "new" && <ProjectForm limits={limits} onSave={save} onCancel={() => setEditing(null)} />}
      {editing === null && value.length < limits.projects && (
        <button
          type="button"
          className="h-14 rounded-2xl border-2 border-dashed border-white/15 text-muted hover:text-primary hover:border-primary flex items-center justify-center gap-2"
          onClick={() => setEditing("new")}
        >
          <Plus className="size-5" /> Add a project ({value.length}/{limits.projects})
        </button>
      )}
    </div>
  );
}

export default ProjectsEditor;
