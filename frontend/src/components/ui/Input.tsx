import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  endNode?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, endNode, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-xl border bg-[var(--bg-elevated)] px-4 py-2.5 text-sm ring-offset-[var(--bg-base)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              {
                "border-[var(--border)]": !error,
                "border-red-500 focus-visible:ring-red-500": error,
                "pl-10": !!icon,
                "pr-10": !!endNode,
              },
              className
            )}
            ref={ref}
            {...props}
          />
          {endNode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center">
              {endNode}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
