import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark hover:shadow-lg active:scale-[0.97] hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg active:scale-[0.97] hover:-translate-y-0.5",
        outline: "border-2 border-border bg-background hover:bg-muted hover:border-primary hover:shadow-md active:scale-[0.97] hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md active:scale-[0.97] hover:-translate-y-0.5",
        ghost: "hover:bg-muted active:scale-[0.97] hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-dark",
        hero: "gradient-primary text-primary-foreground shadow-lg hover:shadow-glow hover:scale-[1.03] active:scale-[0.97] hover:-translate-y-1 transition-all duration-300 before:absolute before:inset-0 before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        accent: "bg-accent text-accent-foreground hover:bg-accent/80 hover:shadow-lg active:scale-[0.97] hover:-translate-y-0.5",
        success: "bg-success text-success-foreground hover:bg-success/80 hover:shadow-lg active:scale-[0.97] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-sm",
        sm: "h-9 px-4 rounded-sm text-xs",
        lg: "h-12 px-8 rounded-sm",
        icon: "h-10 w-10 rounded-sm",
        xl: "h-14 px-10 text-base rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
