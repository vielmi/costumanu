"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "chk peer outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--secondary-800)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--secondary-800)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center transition-none"
      >
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path
            d="M1 4L4.5 7.5L11 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
