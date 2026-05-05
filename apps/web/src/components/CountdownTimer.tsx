'use client';
import { motion } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCountdown } from '@/lib/utils';

interface Props {
  expiresAt: string;
  onExpired?: () => void;
  compact?: boolean;
}

export default function CountdownTimer({ expiresAt, onExpired, compact }: Props) {
  const { seconds, expired } = useCountdown(expiresAt);

  if (expired) {
    onExpired?.();
    return <span className="text-red-400 font-semibold text-sm">Lock expired</span>;
  }

  const isUrgent = seconds < 60;

  if (compact) {
    return (
      <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400 animate-pulse' : 'text-violet-400'}`}>
        {formatCountdown(seconds)}
      </span>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${
        isUrgent
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-violet-500/10 border-violet-500/20'
      }`}
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
    >
      <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-violet-500'} animate-pulse`} />
      <span className="text-xs font-medium text-white/50">Lock expires in</span>
      <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-violet-400'}`}>
        {formatCountdown(seconds)}
      </span>
    </motion.div>
  );
}
