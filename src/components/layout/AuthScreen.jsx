import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Logo from "../ui/Logo";

// Full-screen mobile layout for login and signup.
function AuthScreen({ kicker, title, children, footer }) {
  return (
    <div className="min-h-dvh flex flex-col px-6 pt-safe pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center h-14 -ml-2">
        <Link to="/" className="btn btn-ghost btn-circle" aria-label="Back to home">
          <ChevronLeft className="size-6" />
        </Link>
      </div>
      <div className="mt-4">
        <Logo size="md" />
        <p className="mt-8 font-mono text-xs text-accent">{kicker}</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight">{title}</h1>
      </div>
      <div className="mt-8 flex-1 flex flex-col">{children}</div>
      {footer && <div className="pt-6 text-center text-muted">{footer}</div>}
    </div>
  );
}

export default AuthScreen;
