import { Router } from 'express';
import { FileController } from '../controllers/file.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { authorizeOwnership } from '../middlewares/ownership.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { fileMetadataSchema, toggleVisibilitySchema } from '../schemas/file.schema.js';

const router = Router();

router.get('/', optionalAuth, FileController.getFiles);
router.get('/public', optionalAuth, FileController.getPeerPublicFiles);
router.get('/search', optionalAuth, FileController.searchPublicFiles);
router.post('/', optionalAuth, validate(fileMetadataSchema), FileController.uploadFileMetadata);
router.post('/upload', optionalAuth, upload.single('file'), FileController.uploadBinaryFile);
router.post('/copy', optionalAuth, validate(fileMetadataSchema), FileController.copyPublicFile);
router.patch('/:id/visibility', optionalAuth, authorizeOwnership('FileMetadata', 'userId', 'id'), validate(toggleVisibilitySchema), FileController.toggleVisibility);
router.delete('/:id', optionalAuth, authorizeOwnership('FileMetadata', 'userId', 'id'), FileController.deleteFile);

export default router;
