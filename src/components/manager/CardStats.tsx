// src/components/manager/CardStats.tsx
'use client';

import { motion } from "framer-motion";
import { TrendingUp, LucideIcon } from "lucide-react";

interface CardStatsProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "teal";
  trend?: string;
}

const gradientMap = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  teal: "from-teal-500 to-teal-600",
};

export function CardStats({ title, value, icon: Icon, color, trend }: CardStatsProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 cursor-default"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientMap[color]} text-white shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</p>
    </motion.div>
  );
}