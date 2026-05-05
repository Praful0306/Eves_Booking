'use client';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}

export default function AdminStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="stat-card"
        >
          <div className="text-xl mb-1">{stat.icon}</div>
          <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
