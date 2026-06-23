import * as React from "react";
import { cn } from "../../lib/utils";

export const inputClassName =
  "w-full rounded-xl border border-line bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-red/70 focus:ring-2 focus:ring-brand-red/10 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClassName, className)} {...props} />
  ),
);

Input.displayName = "Input";
