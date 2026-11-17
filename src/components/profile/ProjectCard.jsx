import { CodeXml, ExternalLink } from "lucide-react";
import { Tag } from "./Chips";

// A hobby project: </> badge, title, description, tags and Visit / Code links.
function ProjectCard({ project, className = "", children }) {
  return (
    <section className={`rounded-3xl bg-base-200 border border-white/5 p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-accent/10 border border-accent/25 px-2.5 py-0.5 font-mono text-xs font-bold text-accent">
          &lt;/&gt;
        </span>
        <span className="font-mono text-xs text-muted">built for fun</span>
      </div>
      <h3 className="mt-3 text-2xl font-bold break-words">{project.title}</h3>
      {project.description && (
        <p className="mt-2 text-base-content/85 whitespace-pre-line break-words">{project.description}</p>
      )}
      {project.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      {(project.url || project.repoUrl) && (
        <div className="mt-4 flex gap-2">
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm h-11 px-4 bg-neutral border-0">
              <ExternalLink className="size-4" /> Visit
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm h-11 px-4 bg-neutral border-0">
              <CodeXml className="size-4" /> Code
            </a>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export default ProjectCard;
