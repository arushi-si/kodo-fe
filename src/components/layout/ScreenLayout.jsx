import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Full-screen routes without the tab bar (auth, onboarding, chat, someone's profile).
function ScreenLayout() {
  const { pathname } = useLocation();
  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="min-h-dvh"
    >
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </motion.main>
  );
}

export default ScreenLayout;
