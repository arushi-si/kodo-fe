import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";
import { LIMITS, PASSWORD_RULES } from "../utils/constant";
import { isStrongPassword } from "../utils/helpers";

function Signup() {
  const [form, setForm] = useState({ firstName: "", lastName: "", emailId: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Signup is not wrapped in PublicOnly: once the new user lands in the store we
  // send them to onboarding, not to /feed.
  const [justSignedUp, setJustSignedUp] = useState(false);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const passwordOk = isStrongPassword(form.password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.firstName.trim().length < LIMITS.firstNameMin)
      return setError(`First name needs at least ${LIMITS.firstNameMin} characters`);
    if (!passwordOk) return setError(PASSWORD_RULES);

    setSubmitting(true);
    try {
      const res = await api.post("/signup", form);
      setJustSignedUp(true);
      dispatch(addUser(res.data));
      navigate("/profile?onboarding=1", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (user && !justSignedUp) return <Navigate to="/feed" replace />;

  return (
    <div className="flex items-center mt-6 justify-center px-4">
      <form className="card card-border bg-base-100 w-96" onSubmit={handleSignup}>
        <div className="card-body gap-3">
          <h2 className="card-title">Create your account</h2>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="First name"
              autoComplete="given-name"
              required
              maxLength={LIMITS.nameMax}
              value={form.firstName}
              onChange={update("firstName")}
            />
            <input
              className="input"
              placeholder="Last name"
              autoComplete="family-name"
              required
              maxLength={LIMITS.nameMax}
              value={form.lastName}
              onChange={update("lastName")}
            />
          </div>
          <input
            className="input w-full"
            type="email"
            placeholder="mail@site.com"
            autoComplete="email"
            required
            value={form.emailId}
            onChange={update("emailId")}
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update("password")}
          />
          <p className={`text-xs ${form.password && !passwordOk ? "text-error" : "opacity-70"}`}>
            {PASSWORD_RULES}
          </p>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="card-actions justify-between items-center">
            <Link to="/login" className="link link-hover text-sm">
              Already have an account?
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-sm" />}
              Sign up
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Signup;
