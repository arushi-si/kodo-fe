import { io } from "socket.io-client";
import { BASE_URL } from "./constant";

// One socket for the whole app. It authenticates with the same httpOnly cookie as the REST API,
// so it is only created while a user is logged in (RequireAuth owns its lifetime).
let socket = null;

export const getSocket = () => {
  if (!socket) socket = io(BASE_URL, { withCredentials: true });
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
