'use client';
import { motion } from 'framer-motion';
import SeatCell from './SeatCell';
import { useSeatStore } from '@/store/seatStore';

interface Props {
  rows: number;
  columns: number;
  onSeatClick: (seatId: string) => void;
  loading?: boolean;
}

export default function SeatGrid({ rows, columns, onSeatClick, loading }: Props) {
  const { seats, myLocks } = useSeatStore();

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: Math.min(rows, 8) }).map((_, r) => (
          <div key={r} className="flex gap-2">
            <div className="w-6 shrink-0" />
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="w-9 h-9 rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const seatsByRow: Record<string, typeof seats> = {};
  for (const seat of seats) {
    if (!seatsByRow[seat.rowLabel]) seatsByRow[seat.rowLabel] = [];
    seatsByRow[seat.rowLabel].push(seat);
  }

  const rowLabels = Object.keys(seatsByRow).sort();

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex flex-col gap-2 min-w-max">
        {/* Column numbers */}
        <div className="flex gap-2 pl-8">
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="w-9 text-center text-xs text-white/20 font-medium">{i + 1}</div>
          ))}
        </div>

        {rowLabels.map((rowLabel) => (
          <motion.div key={rowLabel} className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
            <span className="w-6 text-center text-xs font-bold text-white/30 shrink-0">{rowLabel}</span>
            {seatsByRow[rowLabel]
              .sort((a, b) => a.columnNumber - b.columnNumber)
              .map((seat) => (
                <SeatCell
                  key={seat.id}
                  seat={seat}
                  isMyLock={!!myLocks[seat.id]}
                  onClick={onSeatClick}
                />
              ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
