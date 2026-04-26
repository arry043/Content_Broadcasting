const express = require('express');
const contentController = require('../controllers/content.controller');
const validate = require('../middlewares/validate.middleware');
const { uploadSchema } = require('../validations/content.validation');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');
const uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize('teacher'));

router.post(
  '/upload',
  uploadMiddleware,
  validate(uploadSchema),
  contentController.uploadContent
);

router.get('/my', contentController.getMyContent);
router.get('/my/:id', contentController.getMyContentById);
router.delete('/my/:id', contentController.deleteMyContent);

module.exports = router;
