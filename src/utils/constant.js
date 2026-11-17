// REST: in production, calls go to /api on this same domain and vercel.json proxies them to the
// backend. That keeps the login cookie first-party, which Safari requires.
export const BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000");

// Socket.io can't go through the Vercel proxy, so it connects to the backend directly
// (authenticated with a short-lived token from GET /socket-token).
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");

// Product name lives here only, so the rename is a one-line change.
export const APP_NAME = "Kodo";

export const FEED_LIMIT = 10;
export const MIN_FEED_CARDS = 3;
export const SWIPE_THRESHOLD = 110;
export const UNDO_TOAST_MS = 5000;
// Client-side downscale before uploading to Cloudinary.
export const PHOTO_MAX_DIMENSION = 2000;

// Option lists and most limits come from GET /meta (see utils/metaSlice.js).
// These few aren't part of /meta; they mirror the User model (FRONTEND_HANDOFF.md §2).
export const NAME_LIMITS = { firstNameMin: 2, nameMax: 50 };
export const AGE_LIMITS = { min: 18, max: 100 };

export const PASSWORD_RULES =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.";
