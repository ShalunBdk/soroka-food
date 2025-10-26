import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
// SECURITY: Registration disabled for production to prevent unauthorized admin creation
// To create new admin users, use CLI script or database directly
// router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register));
router.get('/profile', authenticateToken, asyncHandler(getProfile));

export default router;
