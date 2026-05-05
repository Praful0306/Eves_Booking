import { create } from 'zustand';

export interface Seat {
  id: string;
  seatNumber: string;
  rowLabel: string;
  columnNumber: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBy: string | null;
  lockedUntil: string | null;
}

export interface MyLock {
  seatId: string;
  seatNumber: string;
  lockToken: string;
  expiresAt: string;
  sessionId: string;
  ttlSeconds: number;
}

interface SeatStore {
  seats: Seat[];
  // Multi-lock: keyed by seatId for O(1) lookup
  myLocks: Record<string, MyLock>;
  setSeats: (seats: Seat[]) => void;
  updateSeat: (seatId: string, updates: Partial<Seat>) => void;
  addMyLock: (lock: MyLock) => void;
  removeMyLock: (seatId: string) => void;
  clearMyLocks: () => void;
  clearAll: () => void;
  // Derived helpers
  getMyLock: (seatId: string) => MyLock | undefined;
  myLocksArray: () => MyLock[];
  earliestExpiry: () => string | null;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  seats: [],
  myLocks: {},

  setSeats: (seats) => set({ seats }),

  updateSeat: (seatId, updates) =>
    set((state) => ({
      seats: state.seats.map((s) => (s.id === seatId ? { ...s, ...updates } : s)),
    })),

  addMyLock: (lock) =>
    set((state) => ({
      myLocks: { ...state.myLocks, [lock.seatId]: lock },
    })),

  removeMyLock: (seatId) =>
    set((state) => {
      const { [seatId]: _removed, ...rest } = state.myLocks;
      return { myLocks: rest };
    }),

  clearMyLocks: () => set({ myLocks: {} }),

  clearAll: () => set({ seats: [], myLocks: {} }),

  getMyLock: (seatId) => get().myLocks[seatId],

  myLocksArray: () => Object.values(get().myLocks),

  earliestExpiry: () => {
    const locks = Object.values(get().myLocks);
    if (!locks.length) return null;
    return locks.reduce((earliest, l) =>
      new Date(l.expiresAt) < new Date(earliest.expiresAt) ? l : earliest
    ).expiresAt;
  },
}));
