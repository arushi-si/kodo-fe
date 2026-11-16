import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from "./Toast";
import Loader from "./Loader";
import api from "../utils/api";
import { addUser } from "../utils/userSlice";

// App shell: restores the session from the cookie once, then renders the routes.
function Body() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [sessionChecked, setSessionChecked] = useState(Boolean(user));

  useEffect(() => {
    if (sessionChecked) return;
    api
      .get("/profile")
      .then((res) => dispatch(addUser(res.data)))
      .catch(() => {}) // not logged in: RequireAuth will send the user to /login
      .finally(() => setSessionChecked(true));
  }, [dispatch, sessionChecked]);

  return (
    <section className="min-h-screen flex flex-col">
      <Navbar />
      <Toast />
      <main className="flex-1 pb-24">{sessionChecked ? <Outlet /> : <Loader />}</main>
      <Footer />
    </section>
  );
}

export default Body;
