import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import UserCard from "./UserCard";
import SkillsInput from "./SkillsInput";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { showToast } from "../utils/toastSlice";
import { EXPERIENCE_LEVELS, GENDERS, LIMITS } from "../utils/constant";
import { isHttpUrl } from "../utils/helpers";

const TEXT_FIELDS = ["firstName", "lastName", "about", "photoUrl", "headline", "location", "githubUrl"];
// Fields the backend rejects as an empty string; leaving them blank means "no change".
const NO_EMPTY = ["age", "gender", "experienceLevel", "photoUrl"];

const toForm = (user) => ({
  ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, user[k] ?? ""])),
  age: user.age ?? "",
  gender: user.gender ?? "",
  experienceLevel: user.experienceLevel ?? "",
  skills: user.skills ?? [],
});

const validate = (f) => {
  const errors = {};
  if (f.firstName.trim().length < LIMITS.firstNameMin)
    errors.firstName = `At least ${LIMITS.firstNameMin} characters`;
  if (f.age !== "" && (Number(f.age) < LIMITS.ageMin || Number(f.age) > LIMITS.ageMax))
    errors.age = `Must be between ${LIMITS.ageMin} and ${LIMITS.ageMax}`;
  if (!isHttpUrl(f.photoUrl)) errors.photoUrl = "Must be an http(s) URL";
  if (!isHttpUrl(f.githubUrl)) errors.githubUrl = "Must be an http(s) URL";
  return errors;
};

// Only send what changed, so we never resend fields the user didn't touch.
const diff = (form, user) => {
  const changes = {};
  for (const [key, value] of Object.entries(form)) {
    if (NO_EMPTY.includes(key) && value === "") continue;
    const normalized = key === "age" ? Number(value) : typeof value === "string" ? value.trim() : value;
    const original = user[key] ?? (key === "skills" ? [] : "");
    if (JSON.stringify(normalized) !== JSON.stringify(original)) changes[key] = normalized;
  }
  return changes;
};

function Field({ label, error, hint, children }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {error ? <p className="label text-error">{error}</p> : hint && <p className="label">{hint}</p>}
    </fieldset>
  );
}

function Profile() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [form, setForm] = useState(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const errors = validate(form);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) return;
    const changes = diff(form, user);
    if (!Object.keys(changes).length) return dispatch(showToast("info", "Nothing to update"));

    setSaving(true);
    try {
      const res = await api.patch("/profile", changes);
      dispatch(addUser(res.data.data));
      setForm(toForm(res.data.data));
      dispatch(showToast("success", "Profile saved"));
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    } finally {
      setSaving(false);
    }
  };

  const preview = { ...user, ...form, age: form.age === "" ? undefined : form.age };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {onboarding && (
        <div role="alert" className="alert alert-info mb-4">
          Welcome! Complete your profile so other developers know who you are.
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <form onSubmit={save} className="card bg-base-100 shadow-sm flex-1 w-full">
          <div className="card-body">
            <h2 className="card-title">Edit profile</h2>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label="First name" error={errors.firstName}>
                <input className="input w-full" maxLength={LIMITS.nameMax} value={form.firstName} onChange={set("firstName")} />
              </Field>
              <Field label="Last name">
                <input className="input w-full" maxLength={LIMITS.nameMax} value={form.lastName} onChange={set("lastName")} />
              </Field>
              <Field label="Age" error={errors.age}>
                <input
                  className="input w-full"
                  type="number"
                  min={LIMITS.ageMin}
                  max={LIMITS.ageMax}
                  value={form.age}
                  onChange={set("age")}
                />
              </Field>
              <Field label="Gender">
                <select className="select w-full" value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Headline">
                <input
                  className="input w-full"
                  placeholder="Full-stack @ Acme"
                  maxLength={LIMITS.shortTextMax}
                  value={form.headline}
                  onChange={set("headline")}
                />
              </Field>
              <Field label="Experience">
                <select className="select w-full" value={form.experienceLevel} onChange={set("experienceLevel")}>
                  <option value="">Select</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input className="input w-full" maxLength={LIMITS.shortTextMax} value={form.location} onChange={set("location")} />
              </Field>
              <Field label="GitHub URL" error={errors.githubUrl}>
                <input
                  className="input w-full"
                  type="url"
                  placeholder="https://github.com/you"
                  value={form.githubUrl}
                  onChange={set("githubUrl")}
                />
              </Field>
            </div>
            <Field label="Photo URL" error={errors.photoUrl}>
              <input className="input w-full" type="url" placeholder="https://…" value={form.photoUrl} onChange={set("photoUrl")} />
            </Field>
            <Field label="Skills" hint={`${form.skills.length}/${LIMITS.skillsMax} · press Enter to add`}>
              <SkillsInput value={form.skills} onChange={(skills) => setForm((f) => ({ ...f, skills }))} />
            </Field>
            <Field label="About" hint={`${form.about.length}/${LIMITS.aboutMax}`}>
              <textarea
                className="textarea w-full"
                rows={4}
                maxLength={LIMITS.aboutMax}
                value={form.about}
                onChange={set("about")}
              />
            </Field>
            <div className="card-actions justify-end mt-2">
              <button type="submit" className="btn btn-primary" disabled={saving || Object.keys(errors).length > 0}>
                {saving && <span className="loading loading-spinner loading-sm" />}
                Save profile
              </button>
            </div>
          </div>
        </form>
        <div className="w-full lg:w-auto flex flex-col items-center gap-2 lg:sticky lg:top-20">
          <p className="text-sm opacity-70">Preview</p>
          <UserCard user={preview} />
        </div>
      </div>
    </div>
  );
}

export default Profile;
