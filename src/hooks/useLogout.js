import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { resetAll } from "../utils/resetAll";

export default function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      // Clear local state anyway; the cookie expires on its own.
      console.error(err);
    }
    dispatch(resetAll());
    navigate("/login", { replace: true });
  };
}
