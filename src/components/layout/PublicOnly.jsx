import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Landing, /login and /signup: send a logged-in user into the app
// (or into onboarding, if they haven't finished it yet).
function PublicOnly() {
  const user = useSelector((state) => state.user);
  const location = useLocation();
  if (user) {
    const to = user.onboardingCompleted ? (location.state?.from ?? "/feed") : "/onboarding";
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}

export default PublicOnly;
