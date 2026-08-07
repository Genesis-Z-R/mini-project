import { prisma } from '../config/db.js';

export const authorizeOwnership = (modelName, ownerField = 'userId', idParamName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParamName];
      const resource = await prisma[modelName].findUnique({
        where: { id: resourceId }
      });

      if (!resource) {
        return res.status(404).json({ success: false, message: `${modelName} resource not found` });
      }

      // Extract user identity from JWT or query/body fallback
      const userEmail = req.user ? req.user.email.toLowerCase() : (req.query.userId || req.body.userId || '').toLowerCase();

      if (ownerField === 'friendship') {
        if (resource.senderId.toLowerCase() !== userEmail && resource.receiverId.toLowerCase() !== userEmail) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not own this friendship resource' });
        }
      } else if (resource[ownerField] && resource[ownerField].toLowerCase() !== userEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this resource' });
      }

      req.resource = resource;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal ownership verification error' });
    }
  };
};
