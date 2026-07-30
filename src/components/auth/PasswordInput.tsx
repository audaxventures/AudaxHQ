"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

/** Password field with a show/hide toggle — shared everywhere a password is entered. `iconClassName` defaults to the dark auth-screen palette; pass the light-form equivalent (see Field.tsx's fieldBase) when embedding in a cream-background card. */
export function PasswordInput({
  id,
  name,
  autoComplete,
  autoFocus,
  required,
  minLength,
  className,
  placeholder,
  iconClassName = "text-navy-300 hover:text-burnt-400",
}: {
  id: string;
  name: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  minLength?: number;
  className?: string;
  placeholder?: string;
  iconClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={cn(className, "pr-11")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer", iconClassName)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
