// components/doctor/CardStats.tsx
import { LucideIcon } from "lucide-react";

interface CardStatsProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "purple" | "orange" | "green";
}

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  green: "from-green-500 to-green-600",
};

export function CardStats({ title, value, icon: Icon, color }: CardStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
}