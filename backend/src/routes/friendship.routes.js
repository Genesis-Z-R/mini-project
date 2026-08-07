import { Router } from 'express';
import { FriendshipController } from '../controllers/friendship.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { authorizeOwnership } from '../middlewares/ownership.middleware.js';
import { friendshipSchema } from '../schemas/friendship.schema.js';

const router = Router();

router.get('/', optionalAuth, FriendshipController.getFriendships);
router.post('/', optionalAuth, validate(friendshipSchema), FriendshipController.sendFriendRequest);
router.put('/:id/accept', optionalAuth, authorizeOwnership('Friendship', 'friendship', 'id'), FriendshipController.acceptFriendRequest);
router.delete('/:id', optionalAuth, authorizeOwnership('Friendship', 'friendship', 'id'), FriendshipController.removeFriendship);

export default router;
