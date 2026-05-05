import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { simulatePaymentSchema } from '@eves/shared';
import { asyncHandler } from '../../utils/helpers';

const router = Router();

// Single-seat (backward compat)
router.post('/simulate-success', authMiddleware, validate(simulatePaymentSchema), asyncHandler(paymentController.simulateSuccess));
router.post('/simulate-failure', authMiddleware, validate(simulatePaymentSchema), asyncHandler(paymentController.simulateFailure));
router.post('/simulate-timeout', authMiddleware, validate(simulatePaymentSchema), asyncHandler(paymentController.simulateTimeout));
router.post('/simulate-crash', authMiddleware, validate(simulatePaymentSchema), asyncHandler(paymentController.simulateCrash));

// Multi-seat bulk
router.post('/simulate-success-bulk', authMiddleware, asyncHandler(paymentController.simulateSuccessBulk));
router.post('/simulate-failure-bulk', authMiddleware, asyncHandler(paymentController.simulateFailureBulk));
router.post('/simulate-timeout-bulk', authMiddleware, asyncHandler(paymentController.simulateTimeoutBulk));
router.post('/simulate-crash-bulk', authMiddleware, asyncHandler(paymentController.simulateCrashBulk));

export { router as paymentRoutes };
