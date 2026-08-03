import { FriendshipService } from '../services/friendship.service.js';

export const FriendshipController = {
  async getFriendships(req, res, next) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      const friendships = await FriendshipService.getFriendshipsByUser(userId);
      return res.status(200).json(friendships);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async sendFriendRequest(req, res, next) {
    try {
      const friendship = await FriendshipService.sendRequest(req.body);
      return res.status(200).json(friendship);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async acceptFriendRequest(req, res, next) {
    try {
      const id = req.params.id;
      const updated = await FriendshipService.acceptRequest(id);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  async removeFriendship(req, res, next) {
    try {
      const id = req.params.id;
      await FriendshipService.removeFriendship(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
