import { APP_NAME } from "../../utils/constant";

// Text logo: the </> mark plus the app name in Space Grotesk with the brand gradient.
function Logo({ size = "md", className = "" }) {
  const text = { sm: "text-xl", md: "text-2xl", lg: "text-4xl", xl: "text-5xl" }[size] ?? "text-2xl";
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-bold ${text} ${className}`}>
      <span className="font-mono text-brand text-[0.8em] tracking-tighter" aria-hidden="true">
        &lt;/&gt;
      </span>
      <span className="text-brand">{APP_NAME}</span>
    </span>
  );
}

export default Logo;
