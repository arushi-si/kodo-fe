import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api";
import { setReceived } from "../utils/requestsSlice";

function RequireAuth() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const userId = user?._id;

  // Load the received requests once per login, for the Navbar badge.
  useEffect(() => {
    if (!userId) return;
    api
      .get("/user/requests/received")
      .then((res) => dispatch(setReceived(res.data)))
      .catch((err) => console.error(err));
  }, [dispatch, userId]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default RequireAuth;
