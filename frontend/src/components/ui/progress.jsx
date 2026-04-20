import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value = 0, color = "primary", ...props }, ref) => {
  const colorMap = {
    primary: "bg-primary-500",
    green: "bg-emerald-500",
    yellow: "bg-amber-400",
    red: "bg-red-500",
    blue: "bg-blue-500",
  }
  return (
    <div ref={ref} className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-[#eeedf0]", className)} {...props}>
      <div className={cn("h-full rounded-full transition-all duration-500 ease-out", colorMap[color] || colorMap.primary)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
})
Progress.displayName = "Progress"
export { Progress }
