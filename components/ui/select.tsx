import * as React from "react";
import { cn } from "../../lib/utils";
import { inputClassName } from "./input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(inputClassName, "appearance-none", className)} {...props} />
));

Select.displayName = "Select";
