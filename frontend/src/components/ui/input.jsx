import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-[#e9e5f0] bg-white px-4 py-2 text-sm text-[#1e1042] transition-all shadow-xs",
      "placeholder:text-[#b0a5c8]",
      "focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"
export { Input }
