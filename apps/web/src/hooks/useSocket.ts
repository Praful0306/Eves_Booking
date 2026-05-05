'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, joinEventRoom, leaveEventRoom } from '@/lib/socket';
import { useSeatStore } from '@/store/seatStore';
import { useAuthStore } from '@/store/authStore';

export function useEventSocket(eventId: string | null) {
  const queryClient = useQueryClient();
  const { updateSeat, removeMyLock, myLocks } = useSeatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();
    joinEventRoom(eventId);

    socket.on('seat:locked', ({ seatId, userId, expiresAt }: any) => {
      updateSeat(seatId, { status: 'LOCKED', lockedBy: userId, lockedUntil: expiresAt });
    });

    socket.on('seat:available', ({ seatId }: any) => {
      updateSeat(seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
      queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    });

    socket.on('seat:booked', ({ seatId }: any) => {
      updateSeat(seatId, { status: 'BOOKED', lockedBy: null, lockedUntil: null });
      queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    });

    socket.on('lock:expired', ({ seatId, message }: any) => {
      updateSeat(seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
      // Remove from my locks if it was mine
      const myLocksSnap = useSeatStore.getState().myLocks;
      if (myLocksSnap[seatId]) {
        removeMyLock(seatId);
        toast.warning(`Seat ${myLocksSnap[seatId].seatNumber} lock expired — seat is now available again.`);
      }
    });

    socket.on('payment:failed', ({ seatId }: any) => {
      updateSeat(seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
    });

    socket.on('payment:crashed', ({ seatId, message }: any) => {
      toast.warning(message || 'Server crash simulated — recovery worker will clean up.');
    });

    socket.on('queue:update', ({ seatId, nextUserId, message }: any) => {
      if (user?.id === nextUserId) {
        toast.info(`Seat is now available — you're next in queue!`);
      }
    });

    socket.on('booking:confirmed', ({ bookingCode, seatId }: any) => {
      toast.success(`Booking confirmed! Code: ${bookingCode}`);
    });

    return () => {
      leaveEventRoom(eventId);
      socket.off('seat:locked');
      socket.off('seat:available');
      socket.off('seat:booked');
      socket.off('lock:expired');
      socket.off('payment:failed');
      socket.off('payment:crashed');
      socket.off('queue:update');
      socket.off('booking:confirmed');
    };
  }, [eventId, user?.id]);
}
