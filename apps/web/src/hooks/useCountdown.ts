'use client';
import { useState, useEffect } from 'react';

export function useCountdown(expiresAt: string | null): { seconds: number; expired: boolean } {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calc = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
      return remaining;
    };

    calc();
    const interval = setInterval(() => {
      if (calc() <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return { seconds, expired: seconds <= 0 && expiresAt !== null };
}
