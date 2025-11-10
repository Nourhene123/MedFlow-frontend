// components/receptionist/CardStats.tsx
import { LucideIcon } from "lucide-react";

interface CardStatsProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "emerald" | "indigo" | "amber";
}

const colorClasses = {
  blue: "from-blue-500 to-blue-600",
  emerald: "from-emerald-500 to-emerald-600",
  indigo: "from-indigo-500 to-indigo-600",
  amber: "from-amber-500 to-amber-600",
};

export function CardStats({ title, value, icon: Icon, color }: CardStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}