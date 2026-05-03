import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 text-sm font-bold uppercase tracking-normal transition-[background-color,color,border-color,box-shadow,transform] duration-75 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 transform-gpu outline-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-primary text-primary-foreground shadow-[3px_3px_0_#808080] hover:bg-zinc-900",
        destructive:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-destructive text-white shadow-[3px_3px_0_#808080] hover:bg-destructive/90",
        outline:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-background text-foreground shadow-[3px_3px_0_#808080] hover:bg-accent",
        secondary:
          "border-t-white border-l-white border-r-zinc-700 border-b-zinc-700 bg-secondary text-secondary-foreground shadow-[3px_3px_0_#808080] hover:bg-accent",
        ghost: "border-transparent shadow-none hover:border-border hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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
