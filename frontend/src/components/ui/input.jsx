import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-xl border border-[#eeedf0] bg-white px-3.5 py-1.5 text-sm text-[#1a1523] transition-all",
      "placeholder:text-[#9e97b0]",
      "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"
export { Input }
