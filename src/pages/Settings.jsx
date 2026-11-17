import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ban, Lock, LogOut } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Avatar from "../components/ui/Avatar";
import { ListSkeleton } from "../components/ui/Skeleton";
import { TextInput } from "../components/fields/inputs";
import useLogout from "../hooks/useLogout";
import useUserActions from "../hooks/useUserActions";
import api, { getErrorMessage } from "../utils/api";
import { showToast } from "../utils/toastSlice";
import { PASSWORD_RULES } from "../utils/constant";
import { fullName, isStrongPassword } from "../utils/helpers";

function Card({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl bg-base-200/60 border border-white/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <Icon className="size-5 text-muted" /> {title}
      </h2>
      {children}
    </section>
  );
}

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
    <Card icon={Lock} title="Change password">
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <TextInput type="password" placeholder="Current password" aria-label="Current password" autoComplete="current-password" required value={form.currentPassword} onChange={set("currentPassword")} />
        <TextInput type="password" placeholder="New password" aria-label="New password" autoComplete="new-password" required value={form.newPassword} onChange={set("newPassword")} />
        <TextInput type="password" placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} />
        <p className="text-xs text-muted">{PASSWORD_RULES}</p>
        {error && <p className="text-error text-sm">{error}</p>}
        <button type="submit" className="btn btn-brand h-12 self-end px-6" disabled={saving}>
          Update password
        </button>
      </form>
    </Card>
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
    <Card icon={Ban} title="Blocked users">
      {blocked === null ? (
        <ListSkeleton rows={2} />
      ) : blocked.length === 0 ? (
        <p className="text-muted text-sm">You haven't blocked anyone.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {blocked.map((u) => (
            <li key={u._id} className="flex items-center gap-3 py-2">
              <Avatar user={u} />
              <span className="flex-1 truncate">{fullName(u)}</span>
              <button className="btn btn-sm h-10 bg-neutral border-0" onClick={() => onUnblock(u._id)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Settings() {
  const logOut = useLogout();
  const email = useSelector((state) => state.user.emailId);
  return (
    <div>
      <PageHeader title="Settings" back="/profile" />
      <div className="px-4 pb-8 flex flex-col gap-4">
        {email && <p className="px-1 font-mono text-xs text-muted">{`// signed in as ${email}`}</p>}
        <ChangePassword />
        <BlockedUsers />
        <button className="btn h-14 bg-base-200 border border-error/30 text-error" onClick={logOut}>
          <LogOut className="size-5" /> Log out
        </button>
      </div>
    </div>
  );
}

export default Settings;
