import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary-700 text-white shadow-sm hover:bg-primary-800 hover:shadow-md active:scale-[0.98]",
        secondary: "bg-white text-primary-700 border border-[#e9e5f0] shadow-xs hover:bg-primary-50 hover:border-primary-200",
        ghost: "text-[#7c6fa0] hover:text-primary-700 hover:bg-primary-50",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
        danger: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-[#e9e5f0] bg-white text-[#1e1042] shadow-xs hover:bg-primary-50 hover:border-primary-300",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs rounded-lg",
        lg: "h-11 px-6",
        icon: "h-10 w-10 rounded-xl",
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
