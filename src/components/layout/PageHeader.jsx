import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Sticky screen header. `back` = true (history back) or a path. `right` = extra buttons.
function PageHeader({ title, back, right, children, className = "" }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === "string") navigate(back);
    else if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/feed");
  };
  return (
    <header
      className={`sticky top-0 z-30 bg-base-100/85 backdrop-blur-md pt-safe ${className}`}
    >
      <div className="flex items-center gap-2 px-4 h-14">
        {back && (
          <button className="btn btn-ghost btn-circle -ml-2" aria-label="Back" onClick={goBack}>
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {typeof title === "string" ? <h1 className="text-2xl font-bold truncate">{title}</h1> : title}
        </div>
        {right}
      </div>
      {children}
    </header>
  );
}

export default PageHeader;
