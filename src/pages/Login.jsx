import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import AuthScreen from "../components/layout/AuthScreen";
import { TextInput } from "../components/fields/inputs";
import PasswordInput from "../components/fields/PasswordInput";
import api, { getErrorMessage } from "../utils/api";
import { addUser } from "../utils/userSlice";

function Login() {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/login", { emailId, password });
      dispatch(addUser(res.data)); // PublicOnly routes to /feed, or /onboarding if unfinished
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      kicker="// welcome back"
      title="Log in"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="text-primary font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <form className="flex-1 flex flex-col gap-4" onSubmit={handleLogin}>
        <TextInput
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={emailId}
          onChange={(e) => setEmailId(e.target.value)}
        />
        <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <div className="mt-auto pt-6">
          <button type="submit" className="btn btn-brand btn-lg h-14 w-full text-lg" disabled={submitting}>
            {submitting && <span className="loading loading-spinner loading-sm" />}
            Log in
          </button>
        </div>
      </form>
    </AuthScreen>
  );
}

export default Login;
