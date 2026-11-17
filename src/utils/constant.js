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
export const SWIPE_THRESHOLD = 120;

export const GENDERS = ["male", "female", "others"];
export const EXPERIENCE_LEVELS = ["student", "junior", "mid", "senior", "lead"];

export const LIMITS = {
  firstNameMin: 2,
  nameMax: 50,
  ageMin: 18,
  ageMax: 100,
  aboutMax: 500,
  skillsMax: 10,
  skillMax: 30,
  shortTextMax: 100,
  messageMax: 2000,
};

export const PASSWORD_RULES =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.";
