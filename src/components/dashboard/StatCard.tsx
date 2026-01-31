import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: ReactNode;
  iconBgClass?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  iconBgClass = "bg-primary/10 text-primary",
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="stat-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                change.type === "increase" ? "text-success" : "text-destructive"
              )}
            >
              {change.type === "increase" ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change.value)}%</span>
              <span className="text-muted-foreground font-normal">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBgClass)}>{icon}</div>
      </div>
    </div>
  );
}
