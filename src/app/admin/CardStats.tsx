// components/CardStats.tsx
import { LucideIcon, Building2, Users, Link2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // si tu utilises shadcn/ui

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Users,
  Link2,
  AlertCircle,
  // tu peux en ajouter d'autres ici sans toucher au reste
};

interface CardStatsProps {
  title: string;
  value: string | number;
  icon: keyof typeof iconMap;
  color?: "blue" | "emerald" | "purple" | "amber" | "rose";
  trend?: string;
  description: string;
  highlight?: boolean;        // nouvelle prop
  highlightText?: string;     // texte d'alerte en bas
}

const colorClasses = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function CardStats({
  title,
  value,
  icon,
  color = "blue",
  trend,
  description,
  highlight = false,
  highlightText,
}: CardStatsProps) {
  const Icon = iconMap[icon] || Building2;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300",
        highlight
          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-2 border-amber-300 dark:border-amber-700"
          : "bg-white dark:bg-gray-800",
        "hover:shadow-md"
      )}
    >
      {/* Petit badge d'alerte en haut à droite si highlight */}
      {highlight && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>Attention</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl text-white", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>

        {trend && (
          <span
            className={cn(
              "text-sm px-3 py-1 rounded-full font-medium",
              trend.startsWith("+")
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {description}
        </p>

        {/* Texte d'avertissement en bas */}
        {highlightText && (
          <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {highlightText}
          </p>
        )}
      </div>
    </div>
  );
}