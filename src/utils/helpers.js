export const fullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ");

export const initials = (user) =>
  ((user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")).toUpperCase();

// Same rules as validator.isStrongPassword() defaults used by the backend.
export const isStrongPassword = (pwd = "") =>
  pwd.length >= 8 &&
  /[a-z]/.test(pwd) &&
  /[A-Z]/.test(pwd) &&
  /[0-9]/.test(pwd) &&
  /[^A-Za-z0-9]/.test(pwd);

export const isHttpUrl = (val) => {
  if (!val) return true;
  try {
    const { protocol } = new URL(val);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

// "14:05" today, "Mon" this week, otherwise "12 Nov"
export const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (now - d < 6 * 24 * 60 * 60 * 1000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
};
