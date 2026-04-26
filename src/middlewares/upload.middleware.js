const uploadConfig = require('../config/multer');
const AppError = require('../utils/AppError');

const upload = uploadConfig.single('file');

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size must not exceed 10MB', 400));
      }
      return next(new AppError(err.message, 400));
    }
    next();
  });
};

module.exports = uploadMiddleware;
