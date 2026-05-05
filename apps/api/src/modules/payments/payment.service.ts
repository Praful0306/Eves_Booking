import { nanoid } from 'nanoid';
import { prisma } from '../../config/database';
import { redis, getLockKey, LOCK_RELEASE_SCRIPT, LOCK_VERIFY_AND_DELETE_SCRIPT } from '../../config/redis';
import { emitToEvent } from '../../config/socket';
import { NotFoundError, LockExpiredError, AppError, ValidationError } from '../../middleware/error.middleware';
import { bookingService } from '../bookings/booking.service';

interface BulkItem {
  seatId: string;
  sessionId: string;
  lockToken: string;
}

export class PaymentService {
  // ─── Single seat (kept for backward compat) ──────────────────────────────

  async simulateSuccess(seatId: string, userId: string, sessionId: string, lockToken: string, amount: number) {
    await this.validateLock(seatId, userId, sessionId);
    const booking = await bookingService.confirmBooking(seatId, userId, sessionId, lockToken, amount);
    await prisma.payment.create({
      data: { bookingId: booking.id, userId, amount, status: 'SUCCESS', simulationType: 'SUCCESS' },
    });
    return { booking, paymentStatus: 'SUCCESS' };
  }

  async simulateFailure(seatId: string, userId: string, sessionId: string, lockToken: string, amount: number) {
    const lock = await this.validateLock(seatId, userId, sessionId);
    const booking = await prisma.booking.create({
      data: { bookingCode: `FAIL-${Date.now()}`, userId, eventId: lock.eventId, seatId, amount, paymentStatus: 'FAILED', bookingStatus: 'CANCELLED' },
    });
    await prisma.payment.create({
      data: { bookingId: booking.id, userId, amount, status: 'FAILED', simulationType: 'FAILURE' },
    });
    await this.releaseLockOnFailure(seatId, userId, sessionId, lock.eventId);
    return { booking, paymentStatus: 'FAILED' };
  }

  async simulateTimeout(seatId: string, userId: string, sessionId: string, lockToken: string, amount: number) {
    const lock = await this.validateLock(seatId, userId, sessionId);
    const booking = await prisma.booking.create({
      data: { bookingCode: `TIMEOUT-${Date.now()}`, userId, eventId: lock.eventId, seatId, amount, paymentStatus: 'TIMEOUT', bookingStatus: 'CANCELLED' },
    });
    await prisma.payment.create({
      data: { bookingId: booking.id, userId, amount, status: 'TIMEOUT', simulationType: 'TIMEOUT' },
    });
    await this.releaseLockOnFailure(seatId, userId, sessionId, lock.eventId);
    return { booking, paymentStatus: 'TIMEOUT' };
  }

  async simulateCrash(seatId: string, userId: string, sessionId: string, lockToken: string, amount: number) {
    const lock = await this.validateLock(seatId, userId, sessionId);
    const booking = await prisma.booking.create({
      data: { bookingCode: `CRASH-${Date.now()}`, userId, eventId: lock.eventId, seatId, amount, paymentStatus: 'PENDING', bookingStatus: 'PENDING' },
    });
    await prisma.payment.create({
      data: { bookingId: booking.id, userId, amount, status: 'PENDING', simulationType: 'CRASH' },
    });
    emitToEvent(lock.eventId, 'payment:crashed', {
      seatId,
      message: 'Server crash simulated — lock will be recovered by worker',
    });
    return { booking, paymentStatus: 'CRASH_SIMULATED' };
  }

  // ─── Multi-seat bulk endpoints ────────────────────────────────────────────

  async simulateSuccessBulk(items: BulkItem[], userId: string, amount: number) {
    if (!items.length) throw new ValidationError('No items provided');

    // Validate all locks first before touching anything
    const locks = await Promise.all(items.map(item => this.validateLock(item.seatId, userId, item.sessionId)));

    const groupCode = `EVES-${nanoid(8).toUpperCase()}`;
    const bookings = [];

    // Confirm each seat atomically (each uses SELECT FOR UPDATE in confirmBooking)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const perSeatAmount = Math.floor(amount / items.length);
      const booking = await bookingService.confirmBooking(
        item.seatId, userId, item.sessionId, item.lockToken, perSeatAmount
      );
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId,
          amount: perSeatAmount,
          status: 'SUCCESS',
          simulationType: 'SUCCESS',
        },
      });
      bookings.push(booking);
    }

    return { bookingGroupCode: groupCode, bookings, paymentStatus: 'SUCCESS', totalAmount: amount };
  }

  async simulateFailureBulk(items: BulkItem[], userId: string, amount: number) {
    if (!items.length) throw new ValidationError('No items provided');

    const locks = await Promise.all(items.map(item => this.validateLock(item.seatId, userId, item.sessionId)));
    const bookings = [];
    const perSeatAmount = Math.floor(amount / items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lock = locks[i];
      const booking = await prisma.booking.create({
        data: { bookingCode: `FAIL-${Date.now()}-${i}`, userId, eventId: lock.eventId, seatId: item.seatId, amount: perSeatAmount, paymentStatus: 'FAILED', bookingStatus: 'CANCELLED' },
      });
      await prisma.payment.create({
        data: { bookingId: booking.id, userId, amount: perSeatAmount, status: 'FAILED', simulationType: 'FAILURE' },
      });
      await this.releaseLockOnFailure(item.seatId, userId, item.sessionId, lock.eventId);
      bookings.push(booking);
    }

    return { bookings, paymentStatus: 'FAILED' };
  }

  async simulateTimeoutBulk(items: BulkItem[], userId: string, amount: number) {
    if (!items.length) throw new ValidationError('No items provided');

    const locks = await Promise.all(items.map(item => this.validateLock(item.seatId, userId, item.sessionId)));
    const bookings = [];
    const perSeatAmount = Math.floor(amount / items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lock = locks[i];
      const booking = await prisma.booking.create({
        data: { bookingCode: `TIMEOUT-${Date.now()}-${i}`, userId, eventId: lock.eventId, seatId: item.seatId, amount: perSeatAmount, paymentStatus: 'TIMEOUT', bookingStatus: 'CANCELLED' },
      });
      await prisma.payment.create({
        data: { bookingId: booking.id, userId, amount: perSeatAmount, status: 'TIMEOUT', simulationType: 'TIMEOUT' },
      });
      await this.releaseLockOnFailure(item.seatId, userId, item.sessionId, lock.eventId);
      bookings.push(booking);
    }

    return { bookings, paymentStatus: 'TIMEOUT' };
  }

  async simulateCrashBulk(items: BulkItem[], userId: string, amount: number) {
    if (!items.length) throw new ValidationError('No items provided');

    const locks = await Promise.all(items.map(item => this.validateLock(item.seatId, userId, item.sessionId)));
    const bookings = [];
    const perSeatAmount = Math.floor(amount / items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lock = locks[i];
      const booking = await prisma.booking.create({
        data: { bookingCode: `CRASH-${Date.now()}-${i}`, userId, eventId: lock.eventId, seatId: item.seatId, amount: perSeatAmount, paymentStatus: 'PENDING', bookingStatus: 'PENDING' },
      });
      await prisma.payment.create({
        data: { bookingId: booking.id, userId, amount: perSeatAmount, status: 'PENDING', simulationType: 'CRASH' },
      });
      // Do NOT release — leave as phantom lock
      emitToEvent(lock.eventId, 'payment:crashed', {
        seatId: item.seatId,
        message: 'Server crash simulated — lock will be recovered by worker',
      });
      bookings.push(booking);
    }

    return { bookings, paymentStatus: 'CRASH_SIMULATED' };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private async validateLock(seatId: string, userId: string, sessionId: string) {
    const lockKey = getLockKey(seatId);
    const lockValue = await redis.get(lockKey);

    if (!lockValue) throw new LockExpiredError('Lock has expired — cannot process payment');

    const expected = `${userId}:${sessionId}`;
    if (lockValue !== expected) throw new LockExpiredError('You do not own this lock');

    const lock = await prisma.lock.findFirst({
      where: { seatId, userId, sessionId, status: 'ACTIVE' },
    });
    if (!lock) throw new NotFoundError('Active lock');

    return lock;
  }

  private async releaseLockOnFailure(seatId: string, userId: string, sessionId: string, eventId: string) {
    const lockKey = getLockKey(seatId);
    const lockValue = `${userId}:${sessionId}`;

    await redis.eval(LOCK_RELEASE_SCRIPT, 1, lockKey, lockValue);

    await prisma.$transaction([
      prisma.seat.update({
        where: { id: seatId },
        data: { status: 'AVAILABLE', lockedBy: null, lockedUntil: null, version: { increment: 1 } },
      }),
      prisma.lock.updateMany({
        where: { seatId, userId, sessionId, status: 'ACTIVE' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      }),
    ]);

    emitToEvent(eventId, 'seat:available', { seatId });
    emitToEvent(eventId, 'payment:failed', { seatId, userId });
  }
}

export const paymentService = new PaymentService();
