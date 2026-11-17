import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MotionConfig } from "framer-motion";
import Toast from "../ui/Toast";
import Logo from "../ui/Logo";
import api from "../../utils/api";
import { addUser } from "../../utils/userSlice";

// App shell: restores the session from the cookie once, then renders the routes inside the
// centered mobile column. framer-motion follows the OS "reduce motion" setting everywhere.
function AppShell() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [sessionChecked, setSessionChecked] = useState(Boolean(user));

  useEffect(() => {
    if (sessionChecked) return;
    api
      .get("/profile")
      .then((res) => dispatch(addUser(res.data)))
      .catch(() => {}) // not logged in: the guards route to the landing page or /login
      .finally(() => setSessionChecked(true));
  }, [dispatch, sessionChecked]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative mx-auto w-full max-w-md min-h-dvh bg-base-100 md:border-x md:border-white/5 md:shadow-2xl overflow-x-clip">
        <Toast />
        {sessionChecked ? (
          <Outlet />
        ) : (
          <div className="min-h-dvh grid place-items-center">
            <Logo size="lg" className="animate-pulse" />
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

export default AppShell;
