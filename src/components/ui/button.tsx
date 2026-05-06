import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 text-sm font-bold transition-[background-color,color,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none active:translate-x-px active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-secondary text-secondary-foreground shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] hover:bg-muted",
        destructive:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-destructive text-destructive-foreground shadow-[inset_1px_1px_0_rgba(255,255,255,.45),inset_-1px_-1px_0_rgba(0,0,0,.35)] hover:bg-destructive/90",
        outline:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-card text-foreground shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] hover:bg-muted",
        secondary:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-card text-card-foreground shadow-[inset_1px_1px_0_#dfdfdf,inset_-1px_-1px_0_#808080] hover:bg-muted",
        ghost:
          "border-transparent shadow-none hover:border-t-white hover:border-l-white hover:border-r-zinc-700 hover:border-b-zinc-700 hover:bg-card",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
