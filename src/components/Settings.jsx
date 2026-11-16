import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Avatar from "./Avatar";
import Loader from "./Loader";
import useLogout from "../hooks/useLogout";
import useUserActions from "../hooks/useUserActions";
import api, { getErrorMessage } from "../utils/api";
import { showToast } from "../utils/toastSlice";
import { PASSWORD_RULES } from "../utils/constant";
import { fullName, isStrongPassword } from "../utils/helpers";

function ChangePassword() {
  const dispatch = useDispatch();
  const empty = { currentPassword: "", newPassword: "", confirm: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isStrongPassword(form.newPassword)) return setError(PASSWORD_RULES);
    if (form.newPassword !== form.confirm) return setError("Passwords don't match");
    setSaving(true);
    try {
      await api.patch("/profile/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(empty);
      dispatch(showToast("success", "Password updated"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card bg-base-100 shadow-sm" onSubmit={submit}>
      <div className="card-body gap-3">
        <h2 className="card-title">Change password</h2>
        <input
          className="input w-full"
          type="password"
          placeholder="Current password"
          autoComplete="current-password"
          required
          value={form.currentPassword}
          onChange={set("currentPassword")}
        />
        <input
          className="input w-full"
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          required
          value={form.newPassword}
          onChange={set("newPassword")}
        />
        <input
          className="input w-full"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={set("confirm")}
        />
        <p className="text-xs opacity-70">{PASSWORD_RULES}</p>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="card-actions justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Update password
          </button>
        </div>
      </div>
    </form>
  );
}

function BlockedUsers() {
  const { unblock } = useUserActions();
  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    api
      .get("/user/blocked")
      .then((res) => setBlocked(res.data))
      .catch(() => setBlocked([]));
  }, []);

  const onUnblock = async (id) => {
    if (await unblock(id)) setBlocked((list) => list.filter((u) => u._id !== id));
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Blocked users</h2>
        {blocked === null ? (
          <Loader className="py-4" />
        ) : blocked.length === 0 ? (
          <p className="opacity-70">You haven't blocked anyone.</p>
        ) : (
          <ul className="list">
            {blocked.map((u) => (
              <li key={u._id} className="list-row items-center">
                <Avatar user={u} />
                <div className="list-col-grow">{fullName(u)}</div>
                <button className="btn btn-sm" onClick={() => onUnblock(u._id)}>
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Settings() {
  const logOut = useLogout();
  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
      <ChangePassword />
      <BlockedUsers />
      <button className="btn btn-outline btn-error" onClick={logOut}>
        Log out
      </button>
    </div>
  );
}

export default Settings;
