import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Body() {
  return (
    <section>
      <Navbar />
      {/* outlet renders child routes defined in a parent route */}
      <Outlet />
      <Footer />
    </section>
  );
}

export default Body;
