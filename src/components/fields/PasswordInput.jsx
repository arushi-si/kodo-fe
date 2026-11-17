import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "./inputs";

function PasswordInput({ label = "Password", ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <Label>{label}</Label>
      <span className="input w-full h-14 rounded-2xl bg-neutral border-0 pl-4 pr-1 text-lg focus-within:outline-2 focus-within:outline-primary">
        <input type={visible ? "text" : "password"} className="grow" {...props} />
        <button
          type="button"
          className="btn btn-ghost btn-circle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
    </label>
  );
}

export default PasswordInput;
