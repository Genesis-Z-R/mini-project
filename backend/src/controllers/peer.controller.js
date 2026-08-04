import { PeerService } from '../services/peer.service.js';

export const PeerController = {
  async getRecommendedPeers(req, res) {
    try {
      const userId = req.query.userId || (req.user ? req.user.email : '');
      if (!userId) {
        return res.status(200).json([]);
      }
      const peers = await PeerService.getRecommendedPeers(userId);
      return res.status(200).json(peers);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
