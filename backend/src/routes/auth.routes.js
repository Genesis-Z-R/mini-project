import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginLimiter, registerLimiter, resetPasswordLimiter } from '../middlewares/rateLimiter.middleware.js';
import { loginSchema, registerSchema, resetPasswordSchema, confirmPasswordSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/logout', AuthController.logout);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/reset-password/confirm', resetPasswordLimiter, validate(confirmPasswordSchema), AuthController.confirmPasswordReset);

export default router;
