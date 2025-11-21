'use client';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  icon: 'building' | 'users' | 'brain' | 'user-check';
  color: 'blue' | 'green' | 'purple' | 'yellow';
  trend: string;
}

const iconLabels: Record<Props['icon'], string> = {
  building: 'Building',
  users: 'Users',
  brain: 'Brain',
  'user-check': 'User Check',
};

const colors = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-yellow-600',
};

export function CardStats({ title, value, icon, color, trend }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
          <span className="text-2xl">{iconLabels[icon]}</span>
        </div>
        <span className="text-sm text-green-600 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {trend}
        </span>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </motion.div>
  );
}