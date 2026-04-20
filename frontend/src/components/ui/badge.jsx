import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-600",
        green: "bg-emerald-50 text-emerald-700",
        yellow: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
        blue: "bg-blue-50 text-blue-700",
        purple: "bg-violet-50 text-violet-700",
        gray: "bg-zinc-100 text-zinc-500",
        outline: "border border-zinc-200 text-zinc-600 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
