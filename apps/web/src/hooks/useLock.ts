'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, getApiError } from '@/lib/api';
import { useSeatStore } from '@/store/seatStore';

export function useLock(sessionId: string) {
  const [locking, setLocking] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const { addMyLock, removeMyLock, updateSeat, seats } = useSeatStore();

  const lock = async (seatId: string) => {
    setLocking(true);
    try {
      const res = await api.post(`/seats/${seatId}/lock`, { sessionId });
      const data = res.data.data;
      const seat = seats.find(s => s.id === seatId);
      addMyLock({
        seatId,
        seatNumber: seat?.seatNumber ?? seatId,
        lockToken: data.lockToken,
        expiresAt: data.expiresAt,
        sessionId,
        ttlSeconds: data.ttlSeconds,
      });
      updateSeat(seatId, { status: 'LOCKED' });
      toast.success(`Seat locked! 5 minutes to complete payment.`);
      return data;
    } catch (err: any) {
      const msg = getApiError(err);
      try {
        const parsed = JSON.parse(err.response?.data?.error?.message || '{}');
        if (parsed.queue) {
          toast.warning(`Seat is locked. You are #${parsed.queue.position} in queue.`);
        } else {
          toast.error(msg);
        }
      } catch {
        toast.error(msg);
      }
      return null;
    } finally {
      setLocking(false);
    }
  };

  const release = async (seatId: string) => {
    setReleasing(true);
    try {
      await api.delete(`/seats/${seatId}/release`, { data: { sessionId } });
      removeMyLock(seatId);
      updateSeat(seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
      toast.info('Seat released.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setReleasing(false);
    }
  };

  const releaseAll = async (locks: { seatId: string; sessionId: string }[]) => {
    setReleasing(true);
    try {
      await api.post('/seats/release-bulk', { locks });
      for (const l of locks) {
        removeMyLock(l.seatId);
        updateSeat(l.seatId, { status: 'AVAILABLE', lockedBy: null, lockedUntil: null });
      }
      toast.info('All seats released.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setReleasing(false);
    }
  };

  return { lock, release, releaseAll, locking, releasing };
}
