import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef(({ className, size = "md", ...props }, ref) => {
  const sizeMap = { sm: "h-7 w-7 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm", xl: "h-12 w-12 text-sm" }
  return <div ref={ref} className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeMap[size], className)} {...props} />
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-semibold text-white", className)} {...props} />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
