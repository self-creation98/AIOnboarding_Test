import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-700",
        green: "bg-emerald-100 text-emerald-700",
        yellow: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
        blue: "bg-blue-100 text-blue-700",
        purple: "bg-primary-100 text-primary-700",
        gray: "bg-[#f0ecf5] text-[#7c6fa0]",
        outline: "border border-[#e9e5f0] text-[#7c6fa0] bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
