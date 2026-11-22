import axios from "axios";
import { BASE_URL } from "./constant";
import { resetAll } from "./resetAll";
import { serverDown, serverUp, serverWaking } from "./serverSlice";

const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// These endpoints return 401 for a wrong password, which is not an expired session.
const NO_LOGOUT_ON_401 = ["/login", "/profile/password"];

// The backend runs on Render's free plan, which sleeps after ~15 idle minutes. While it starts up
// (up to ~60s), the proxy answers 502/503/504. Those requests never reached the app, so they're
// safe to repeat. Requests with no response at all (network error) are only repeated for GETs,
// because a POST might have gone through before the connection dropped.
const WAKE_STATUSES = [502, 503, 504];
const MAX_WAIT_MS = 90_000;
const backoff = (attempt) => Math.min(1000 * 2 ** attempt, 8000); // 1s, 2s, 4s, 8s, 8s, ...
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isServerUnavailable = (err) => {
  const status = err?.response?.status;
  return status ? WAKE_STATUSES.includes(status) : !axios.isCancel(err);
};

const shouldRetry = (err) => {
  const config = err.config;
  if (!config || config.noRetry || axios.isCancel(err)) return false;
  if (err.response) return WAKE_STATUSES.includes(err.response.status);
  return (config.method ?? "get").toLowerCase() === "get";
};

// Render often *holds* requests while it starts instead of failing fast, so a request that's
// still pending after this long almost certainly means the server is waking up.
const SLOW_REQUEST_MS = 4000;

// The store is injected from main.jsx to avoid a circular import (store -> slices -> api -> store).
export const setupInterceptors = (store) => {
  const clearSlowTimer = (config) => {
    if (config?.__slowTimer) clearTimeout(config.__slowTimer);
  };

  api.interceptors.request.use((config) => {
    clearSlowTimer(config); // a retried request carries the previous attempt's timer
    config.__slowTimer = setTimeout(() => store.dispatch(serverWaking()), SLOW_REQUEST_MS);
    return config;
  });

  api.interceptors.response.use(
    (res) => {
      clearSlowTimer(res.config);
      if (store.getState().server.status !== "up") store.dispatch(serverUp());
      return res;
    },
    async (err) => {
      clearSlowTimer(err.config);
      // any real HTTP answer from our app (401, 404, 409, ...) means the server is up
      if (err.response && !WAKE_STATUSES.includes(err.response.status)) {
        if (store.getState().server.status !== "up") store.dispatch(serverUp());
      }

      if (shouldRetry(err)) {
        const config = err.config;
        config.__wake ??= { attempt: 0, startedAt: Date.now() };
        if (Date.now() - config.__wake.startedAt < MAX_WAIT_MS) {
          store.dispatch(serverWaking());
          await sleep(backoff(config.__wake.attempt++));
          return api(config);
        }
        store.dispatch(serverDown());
      } else if (isServerUnavailable(err) && !err.config?.noRetry) {
        // a POST that failed with no response: don't repeat it, but tell the user why
        store.dispatch(serverDown());
      }

      const url = err.config?.url ?? "";
      if (err.response?.status === 401 && !NO_LOGOUT_ON_401.includes(url)) {
        // Clearing the user makes RequireAuth redirect to /login.
        store.dispatch(resetAll());
      }
      return Promise.reject(err);
    },
  );
};

// Pings the backend so a sleeping server starts waking up (the interceptor shows the banner).
export const wakeServer = () => api.get("/health").catch(() => {});

export const getErrorMessage = (err) => {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return "You're offline. Check your connection and try again.";
  if (isServerUnavailable(err))
    return "We couldn't reach the server. It may still be starting up, so please try again in a moment.";
  const data = err?.response?.data;
  return (data && typeof data === "object" && data.error) || "Something went wrong";
};

export const getStatus = (err) => err?.response?.status;

export default api;
