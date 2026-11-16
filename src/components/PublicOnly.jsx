import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// /login and /signup: send an already logged-in user into the app.
function PublicOnly() {
  const user = useSelector((state) => state.user);
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from ?? "/feed"} replace />;
  return <Outlet />;
}

export default PublicOnly;
