import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:scale-[1.02] hover:bg-blue-700 hover:shadow-xl",
        destructive: "bg-red-600 text-white hover:scale-[1.02] hover:bg-red-700 hover:shadow-xl",
        outline: "border border-white/20 bg-white/10 text-gray-100 hover:scale-[1.02] hover:bg-white/15 hover:shadow-xl",
        secondary: "bg-white/10 text-white hover:scale-[1.02] hover:bg-white/20 hover:shadow-xl",
        ghost: "bg-transparent text-white/75 shadow-none hover:bg-white/10 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline hover:text-blue-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
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
