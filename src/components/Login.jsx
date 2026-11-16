import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
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
      dispatch(addUser(res.data)); // PublicOnly redirects to /feed
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center mt-6 justify-center px-4">
      <form className="card card-border bg-base-100 w-96" onSubmit={handleLogin}>
        <div className="card-body gap-3">
          <h2 className="card-title">Login</h2>
          <label className="input w-full">
            <span className="label">Email</span>
            <input
              type="email"
              placeholder="mail@site.com"
              autoComplete="email"
              required
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
            />
          </label>
          <label className="input w-full">
            <span className="label">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="card-actions justify-between items-center">
            <Link to="/signup" className="link link-hover text-sm">
              New here? Create an account
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-sm" />}
              Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
