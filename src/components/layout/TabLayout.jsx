import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import TabBar from "./TabBar";

// Logged-in tabs: content padded so the fixed tab bar never covers it.
function TabLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="pb-tabbar min-h-dvh"
      >
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </motion.main>
      <TabBar />
    </>
  );
}

export default TabLayout;
