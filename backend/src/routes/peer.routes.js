import { Router } from 'express';
import { PeerController } from '../controllers/peer.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/recommended', optionalAuth, PeerController.getRecommendedPeers);

export default router;
