import { useSelector } from "react-redux";
import { Briefcase, CodeXml, MapPin } from "lucide-react";
import PromptCard from "./PromptCard";
import ProjectCard from "./ProjectCard";
import { DemoBadge, SkillChip } from "./Chips";
import { capitalize, fullName, photoUrls, sharedSkills } from "../../utils/helpers";

function Photo({ url, name, first }) {
  return (
    <img
      src={url}
      alt={name}
      loading={first ? "eager" : "lazy"}
      draggable={false}
      className="w-full aspect-[4/5] object-cover rounded-3xl bg-base-300"
    />
  );
}

function SkillsAbout({ user, shared }) {
  const sharedSet = new Set(shared.map((s) => s.toLowerCase()));
  if (!user.skills?.length && !user.about && !user.githubUrl) return null;
  return (
    <section className="rounded-3xl bg-base-200 border border-white/5 p-6 flex flex-col gap-4">
      {user.skills?.length > 0 && (
        <div>
          <p className="font-mono text-[13px] text-muted">
            {shared.length ? `// stack · ${shared.length} shared` : "// stack"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.skills.map((s) => (
              <SkillChip key={s} shared={sharedSet.has(s.toLowerCase())}>
                {s}
              </SkillChip>
            ))}
          </div>
        </div>
      )}
      {user.about && (
        <div>
          <p className="font-mono text-[13px] text-muted">{"// about"}</p>
          <p className="mt-2 text-lg leading-relaxed whitespace-pre-line break-words">{user.about}</p>
        </div>
      )}
      {user.githubUrl && (
        <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm h-11 self-start bg-neutral border-0">
          <CodeXml className="size-4" /> GitHub
        </a>
      )}
    </section>
  );
}

// Hinge-style vertical profile: photo, prompt, photo, project, photo, skills/about, and so on.
// Used in the feed sheet, on /user/:id and for the onboarding preview.
function FullProfile({ user, footer }) {
  const me = useSelector((state) => state.user);
  const photos = photoUrls(user);
  const name = fullName(user);
  const shared = sharedSkills(me, user);

  const content = [];
  const prompts = user.prompts ?? [];
  const projects = user.projects ?? [];
  const extras = [
    ...[prompts[0], projects[0]].filter(Boolean),
    "skills",
    ...prompts.slice(1).flatMap((p, i) => [p, projects[i + 1]]).filter(Boolean),
    ...projects.slice(prompts.length || 1),
  ];
  const renderExtra = (item, key) =>
    item === "skills" ? (
      <SkillsAbout key={key} user={user} shared={shared} />
    ) : item.question ? (
      <PromptCard key={key} prompt={item} />
    ) : (
      <ProjectCard key={key} project={item} />
    );

  const steps = Math.max(photos.length, extras.length);
  for (let i = 0; i < steps; i++) {
    if (photos[i]) content.push(<Photo key={`p${i}`} url={photos[i]} name={name} first={i === 0} />);
    if (extras[i]) content.push(renderExtra(extras[i], `e${i}`));
  }

  const facts = [
    user.experienceLevel && { icon: Briefcase, text: capitalize(user.experienceLevel) },
    user.location && { icon: MapPin, text: user.location },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <header className="px-1 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-4xl font-bold">
            {user.firstName}
            {user.age && <span className="font-normal text-muted">, {user.age}</span>}
          </h1>
          {user.isDemo && <DemoBadge />}
        </div>
        {user.headline && <p className="mt-1 text-lg text-base-content/90">{user.headline}</p>}
        {facts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {facts.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="size-4" /> {text}
              </span>
            ))}
          </div>
        )}
        {shared.length > 0 && (
          <p className="mt-2 font-mono text-xs text-accent">
            {`// ${shared.length} shared skill${shared.length > 1 ? "s" : ""}: ${shared.join(", ")}`}
          </p>
        )}
      </header>
      {content}
      {footer}
    </div>
  );
}

export default FullProfile;
