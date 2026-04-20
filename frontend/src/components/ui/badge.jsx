import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#f0eef2] text-[#6e6880]",
        green: "bg-emerald-50 text-emerald-700",
        yellow: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-600",
        blue: "bg-blue-50 text-blue-700",
        purple: "bg-primary-50 text-primary-700",
        gray: "bg-[#f0eef2] text-[#6e6880]",
        outline: "border border-[#eeedf0] text-[#6e6880] bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
