import { Request, Response } from 'express';
import { lockService } from './lock.service';

export class LockController {
  async acquireLock(req: Request, res: Response) {
    const { seatId } = req.params;
    const userId = req.user!.id;
    const { sessionId } = req.body;
    const result = await lockService.acquireLock(seatId, userId, sessionId);
    res.status(201).json({ success: true, data: result });
  }

  async acquireLockBulk(req: Request, res: Response) {
    const userId = req.user!.id;
    const { seatIds, sessionId } = req.body;
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({ success: false, error: { message: 'seatIds must be a non-empty array' } });
      return;
    }
    const result = await lockService.acquireLockBulk(seatIds, userId, sessionId);
    res.status(result.failed.length === 0 ? 201 : 207).json({ success: true, data: result });
  }

  async releaseLock(req: Request, res: Response) {
    const { seatId } = req.params;
    const userId = req.user!.id;
    const sessionId = req.headers['x-session-id'] as string || req.body.sessionId;
    await lockService.releaseLock(seatId, userId, sessionId);
    res.json({ success: true, message: 'Lock released' });
  }

  async releaseLockBulk(req: Request, res: Response) {
    const userId = req.user!.id;
    const { locks } = req.body;
    if (!Array.isArray(locks) || locks.length === 0) {
      res.status(400).json({ success: false, error: { message: 'locks must be a non-empty array' } });
      return;
    }
    const result = await lockService.releaseLockBulk(locks, userId);
    res.json({ success: true, data: result });
  }

  async extendLock(req: Request, res: Response) {
    const userId = req.user!.id;
    const { seatId, sessionId, additionalSeconds } = req.body;
    const result = await lockService.extendLock(seatId, userId, sessionId, additionalSeconds);
    res.json({ success: true, data: result });
  }

  async getMyActiveLocks(req: Request, res: Response) {
    const locks = await lockService.getMyActiveLocks(req.user!.id);
    res.json({ success: true, data: locks });
  }
}

export const lockController = new LockController();
