const express = require('express');
const approvalController = require('../controllers/approval.controller');
const validate = require('../middlewares/validate.middleware');
const { rejectSchema } = require('../validations/approval.validation');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize('principal'));

router.get('/pending', approvalController.getPendingContent);
router.get('/all', approvalController.getAllContent);

router.post('/:contentId/approve', approvalController.approveContent);
router.post(
  '/:contentId/reject',
  validate(rejectSchema),
  approvalController.rejectContent
);

module.exports = router;
