import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          "flex w-full px-4 py-3 rounded-xl",
          "bg-card/50 backdrop-blur-sm",
          "border border-border/50",
          "text-foreground text-sm",
          "transition-all duration-300 ease-out",
          "placeholder:text-muted-foreground",
          "hover:border-primary/50 hover:bg-card/70",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
          {input}
        </div>
      );
    }

    return input;
  }
);
Input.displayName = "Input";
