import { io } from "socket.io-client";
import { SOCKET_URL } from "./constant";
import api from "./api";

// One socket for the whole app, created only while a user is logged in (RequireAuth owns its lifetime).
// The socket connects to the backend directly (not through the /api proxy), so the cookie isn't
// available there. Before every connection attempt, including reconnects, we fetch a 60-second
// token through the proxy, where the cookie does work, and send it in the handshake.
let socket = null;

const fetchSocketToken = async (cb) => {
  try {
    const { data } = await api.get("/socket-token");
    cb({ token: data.token });
  } catch {
    cb({}); // handshake fails with "Unauthorized"; a 401 here is handled by the api interceptor
  }
};

export const getSocket = () => {
  if (!socket) {
    if (!SOCKET_URL) console.error("VITE_SOCKET_URL is not set; chat will not connect");
    socket = io(SOCKET_URL, { withCredentials: true, auth: fetchSocketToken });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

// Promise wrapper around emit-with-ack. Resolves to the server's { ok, ... } payload.
export const emitWithAck = (event, payload) =>
  new Promise((resolve) => {
    getSocket()
      .timeout(10000)
      .emit(event, payload, (err, res) =>
        resolve(err ? { ok: false, status: 0, error: "Connection problem, try again" } : res),
      );
  });
