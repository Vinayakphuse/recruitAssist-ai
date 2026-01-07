import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

export function Logo({ className, size = "md", variant = "dark" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2 font-bold", sizeClasses[size], className)}>
      <div className="relative">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-primary-foreground font-extrabold text-sm">AI</span>
        </div>
      </div>
      <span className={cn(
        "tracking-tight",
        variant === "light" ? "text-sidebar-foreground" : "text-foreground"
      )}>
        cruiter
      </span>
    </div>
  );
}
