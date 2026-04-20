import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-9 w-full rounded-xl border border-[#eeedf0] bg-white px-3 py-1.5 text-sm text-[#1a1523] transition-all appearance-none",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239e97b0%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_10px_center] bg-no-repeat pr-8",
      "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >{children}</select>
))
Select.displayName = "Select"
export { Select }
