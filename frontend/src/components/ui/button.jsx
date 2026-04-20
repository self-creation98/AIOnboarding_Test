import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-zinc-800",
        secondary:
          "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
        ghost:
          "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700",
        danger:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50",
        primary:
          "bg-primary-600 text-white hover:bg-primary-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
