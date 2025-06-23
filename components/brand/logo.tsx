import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Badge */}
      <div
        className={cn(
          "relative rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-2 shadow-lg",
          sizeClasses[size],
        )}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />

        {/* Logo Icon */}
        <div className="relative flex items-center justify-center">
          <Building2 className={cn("text-white", iconSizeClasses[size])} />
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <h1
            className={cn(
              "font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent",
              textSizeClasses[size],
            )}
          >
            ConstructPro
          </h1>
          <p className="text-xs text-muted-foreground -mt-1">Construction Management</p>
        </div>
      )}
    </div>
  )
}
