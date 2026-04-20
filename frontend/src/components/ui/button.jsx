import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800",
        secondary: "bg-white text-[#6e6880] border border-[#eeedf0] hover:bg-[#f5f3ff] hover:text-primary-600 hover:border-primary-200",
        ghost: "text-[#6e6880] hover:text-primary-600 hover:bg-primary-50",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        danger: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[#eeedf0] bg-white text-[#1a1523] hover:bg-[#faf9fb] hover:border-[#ddd9e4]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs rounded-lg",
        lg: "h-10 px-6",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = "Button"
export { Button, buttonVariants }
