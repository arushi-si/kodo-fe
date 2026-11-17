import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { SkeletonBlock } from "../components/ui/Skeleton";
import useMeta from "../hooks/useMeta";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { showToast } from "../utils/toastSlice";
import { EDIT_SECTIONS } from "../onboarding/steps";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// One collapsible section per onboarding step, reusing the step's Field.
function Section({ step, user, meta, defaultOpen }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState(() => step.init(user));
  const [saving, setSaving] = useState(false);
  const result = step.validate(draft, { user, meta });
  const dirty = !step.selfSaving && !same(draft, step.init(user));

  const save = async (e) => {
    e.preventDefault();
    if (result !== true || !dirty) return;
    setSaving(true);
    try {
      const res = await api.patch("/profile", step.toPatch(draft));
      dispatch(addUser(res.data.data));
      setDraft(step.init(res.data.data));
      dispatch(showToast("success", `${step.section} saved`));
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl bg-base-200/60 border border-white/5">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 h-16 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex-1 font-display text-lg font-semibold">{step.section}</span>
        {dirty && <span className="font-mono text-[11px] text-accent">unsaved</span>}
        <ChevronDown className={`size-5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <form onSubmit={save} className="px-5 pb-5 flex flex-col gap-4">
          <step.Field value={draft} onChange={setDraft} meta={meta} user={user} />
          {typeof result === "string" && <p className="text-sm text-error">{result}</p>}
          {!step.selfSaving && (
            <div className="flex gap-2 justify-end">
              {dirty && (
                <button type="button" className="btn btn-ghost" onClick={() => setDraft(step.init(user))}>
                  Discard
                </button>
              )}
              <button type="submit" className="btn btn-brand px-6" disabled={!dirty || result !== true || saving}>
                {saving && <span className="loading loading-spinner loading-sm" />}
                Save
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

function EditProfile() {
  const user = useSelector((state) => state.user);
  const { meta } = useMeta();
  return (
    <div>
      <PageHeader title="Edit profile" back="/profile" />
      <div className="px-4 pb-8 flex flex-col gap-3">
        {!meta
          ? Array.from({ length: 6 }, (_, i) => <SkeletonBlock key={i} className="h-16 rounded-3xl" />)
          : EDIT_SECTIONS.map((step) => (
              <Section key={step.id} step={step} user={user} meta={meta} defaultOpen={step.id === "photos"} />
            ))}
      </div>
    </div>
  );
}

export default EditProfile;
