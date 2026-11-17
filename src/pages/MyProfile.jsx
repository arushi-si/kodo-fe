import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Eye, Pencil, Settings } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileSheet from "../components/feed/ProfileSheet";
import { EDIT_SECTIONS } from "../onboarding/steps";
import useMeta from "../hooks/useMeta";

// Profile tab: my card as others see it, completeness nudge, edit and settings.
function MyProfile() {
  const user = useSelector((state) => state.user);
  const { meta } = useMeta();
  const [previewOpen, setPreviewOpen] = useState(false);

  const missing = meta
    ? EDIT_SECTIONS.filter((s) => s.done && !s.done(user, meta)).map((s) => s.section)
    : [];

  return (
    <div>
      <PageHeader
        title="Profile"
        right={
          <Link to="/settings" className="btn btn-ghost btn-circle" aria-label="Settings">
            <Settings className="size-6" />
          </Link>
        }
      />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <div className="h-[min(520px,58dvh)]">
          <ProfileCard user={user} onOpen={() => setPreviewOpen(true)} />
        </div>
        {missing.length > 0 && (
          <Link to="/profile/edit" className="rounded-2xl bg-base-200 border border-white/5 p-4 flex flex-col gap-1">
            <span className="font-mono text-xs text-accent">{"// TODO"}</span>
            <span className="text-sm text-muted">
              Add {missing.slice(0, 3).join(", ").toLowerCase()}
              {missing.length > 3 ? " and more" : ""} to get more matches.
            </span>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button className="btn h-14 bg-base-200 border border-white/10" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-5" /> Preview
          </button>
          <Link to="/profile/edit" className="btn btn-brand h-14">
            <Pencil className="size-5" /> Edit profile
          </Link>
        </div>
      </div>
      <ProfileSheet user={previewOpen ? user : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

export default MyProfile;
