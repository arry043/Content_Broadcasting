const AppError = require('../utils/AppError');

const authorize = (allowedRole) => {
  return (req, res, next) => {
    try {
      if (!req.user || req.user.role !== allowedRole) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
