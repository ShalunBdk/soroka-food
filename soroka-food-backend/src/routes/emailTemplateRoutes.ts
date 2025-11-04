import { Router } from 'express';
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  getTemplateVariables
} from '../controllers/emailTemplateController';
import { requireSuperAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All email template routes require SUPER_ADMIN role
router.use(requireSuperAdmin);

router.get('/', asyncHandler(getAllTemplates));
router.get('/variables', asyncHandler(getTemplateVariables));
router.get('/:id', asyncHandler(getTemplate));
router.post('/', asyncHandler(createTemplate));
router.put('/:id', asyncHandler(updateTemplate));
router.delete('/:id', asyncHandler(deleteTemplate));
router.post('/:id/preview', asyncHandler(previewTemplate));

export default router;
