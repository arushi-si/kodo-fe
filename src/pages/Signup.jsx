import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import AuthScreen from "../components/layout/AuthScreen";
import { TextInput } from "../components/fields/inputs";
import PasswordInput from "../components/fields/PasswordInput";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { NAME_LIMITS, PASSWORD_RULES } from "../utils/constant";
import { isStrongPassword } from "../utils/helpers";

const RULES = [
  ["8+ characters", (p) => p.length >= 8],
  ["uppercase", (p) => /[A-Z]/.test(p)],
  ["lowercase", (p) => /[a-z]/.test(p)],
  ["number", (p) => /[0-9]/.test(p)],
  ["symbol", (p) => /[^A-Za-z0-9]/.test(p)],
];

// Only the essentials: the rest of the profile is asked one question at a time in /onboarding.
function Signup() {
  const [form, setForm] = useState({ firstName: "", emailId: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.firstName.trim().length < NAME_LIMITS.firstNameMin)
      return setError(`First name needs at least ${NAME_LIMITS.firstNameMin} characters`);
    if (!isStrongPassword(form.password)) return setError(PASSWORD_RULES);

    setSubmitting(true);
    try {
      const res = await api.post("/signup", { ...form, firstName: form.firstName.trim() });
      dispatch(addUser(res.data)); // PublicOnly sends the new user to /onboarding
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      kicker="// git init"
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form className="flex-1 flex flex-col gap-4" onSubmit={handleSignup}>
        <TextInput
          label="First name"
          autoComplete="given-name"
          required
          maxLength={NAME_LIMITS.nameMax}
          value={form.firstName}
          onChange={update("firstName")}
        />
        <TextInput
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={form.emailId}
          onChange={update("emailId")}
        />
        <div>
          <PasswordInput autoComplete="new-password" required value={form.password} onChange={update("password")} />
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Password requirements">
            {RULES.map(([label, test]) => {
              const ok = test(form.password);
              return (
                <li
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 h-7 font-mono text-[11px] border ${
                    ok ? "border-accent/40 text-accent bg-accent/10" : "border-white/10 text-muted"
                  }`}
                >
                  {ok && <Check className="size-3" />} {label}
                </li>
              );
            })}
          </ul>
        </div>
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <div className="mt-auto pt-6">
          <button type="submit" className="btn btn-brand btn-lg h-14 w-full text-lg" disabled={submitting}>
            {submitting && <span className="loading loading-spinner loading-sm" />}
            Create account
          </button>
        </div>
      </form>
    </AuthScreen>
  );
}

export default Signup;
