"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-white inline-flex h-6 w-11 shrink-0 items-center border-2 border-t-zinc-700 border-l-zinc-700 border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 border-2 border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-card shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
