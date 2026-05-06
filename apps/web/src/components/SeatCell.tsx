'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Seat {
  id: string;
  seatNumber: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBy: string | null;
}

interface Props {
  seat: Seat;
  isMyLock: boolean;
  onClick: (seatId: string) => void;
  disabled?: boolean;
}

export default function SeatCell({ seat, isMyLock, onClick, disabled }: Props) {
  const statusClass = isMyLock
    ? 'seat-mine'
    : seat.status === 'AVAILABLE'
    ? 'seat-available'
    : seat.status === 'LOCKED'
    ? 'seat-locked'
    : 'seat-booked';

  const isClickable = (seat.status === 'AVAILABLE' || isMyLock) && !disabled;

  return (
    <motion.button
      whileHover={isClickable ? { scale: 1.12 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      layout
      className={cn('seat-cell', statusClass)}
      onClick={() => isClickable && onClick(seat.id)}
      title={
        isMyLock ? 'Your seat — click to deselect'
        : seat.status === 'LOCKED' ? 'Locked by another user'
        : seat.status === 'BOOKED' ? 'Already booked'
        : `Click to lock ${seat.seatNumber}`
      }
      aria-label={seat.seatNumber}
    >
      {seat.seatNumber.replace(/[A-Z]/g, '')}
    </motion.button>
  );
}
