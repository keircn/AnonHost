import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
    variant === "default" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    variant === "secondary" && "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    variant === "outline" && "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
    variant === "destructive" && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    variant === "link" && "text-primary underline-offset-4 hover:underline",
    size === "sm" && "h-8 rounded-md px-3 text-xs",
    size === "default" && "h-9 px-4 py-2",
    size === "lg" && "h-10 rounded-md px-6",
    size === "icon" && "size-9",
    className,
  );

  if (asChild) {
    const child = React.Children.only(props.children) as React.ReactElement;
    return React.cloneElement(child, {
      className: cn(baseClasses, child.props.className),
      ...props,
    });
  }

  return <button className={baseClasses} {...props} />;
}

export { Button };
