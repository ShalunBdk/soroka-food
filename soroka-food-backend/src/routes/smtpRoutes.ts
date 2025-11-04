import { Router } from 'express';
import { getSmtpSettings, updateSmtpSettings, testSmtp } from '../controllers/smtpController';
import { requireSuperAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Log all SMTP route requests
router.use((req, res, next) => {
  process.stdout.write(`\n>>> SMTP ROUTE HIT: ${req.method} ${req.path}\n`);
  console.log(`>>> SMTP Route: ${req.method} ${req.path}`);
  next();
});

// All SMTP routes require SUPER_ADMIN role
router.use(requireSuperAdmin);

router.get('/', asyncHandler(getSmtpSettings));
router.put('/', asyncHandler(updateSmtpSettings));
router.post('/test', asyncHandler(testSmtp));

export default router;
