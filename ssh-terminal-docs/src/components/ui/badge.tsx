import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "destructive" | "warning"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
  const variants: Record<Required<BadgeProps>["variant"], string> = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "text-foreground",
    success: "border-transparent bg-emerald-100 text-emerald-700",
    destructive: "border-transparent bg-red-100 text-red-700",
    warning: "border-transparent bg-orange-100 text-orange-700",
  }
  return <span className={cn(base, variants[variant], className)} {...props} />
}


