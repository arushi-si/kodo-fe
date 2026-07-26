import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";
import { BASE_URL } from "../utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useEffect } from "react";

function Body() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.user);
  const fetchUser = async () => {
    if (userData) return;
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        withCredentials: true,
      });
      dispatch(addUser(response.data));
    } catch (error) {
      navigate("/login");
      console.error(error);
    }
  };

  useEffect(() => {
    if (!userData) fetchUser();
  }, []);

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
