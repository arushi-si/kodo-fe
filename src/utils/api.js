import axios from "axios";
import { BASE_URL } from "./constant";
import { resetAll } from "./resetAll";

const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// These endpoints return 401 for a wrong password, which is not an expired session.
const NO_LOGOUT_ON_401 = ["/login", "/profile/password"];

// The store is injected from main.jsx to avoid a circular import (store -> slices -> api -> store).
export const setupInterceptors = (store) => {
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      const url = err.config?.url ?? "";
      if (err.response?.status === 401 && !NO_LOGOUT_ON_401.includes(url)) {
        // Clearing the user makes RequireAuth redirect to /login.
        store.dispatch(resetAll());
      }
      return Promise.reject(err);
    },
  );
};

export const getErrorMessage = (err) =>
  err?.response?.data?.error ?? (err?.response ? "Something went wrong" : "Network error");

export const getStatus = (err) => err?.response?.status;

export default api;
