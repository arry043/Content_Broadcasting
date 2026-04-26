const express = require('express');
const authRoutes = require('./auth.routes');
const contentRoutes = require('./content.routes');
const approvalRoutes = require('./approval.routes');
const broadcastRoutes = require('./broadcast.routes');
const analyticsRoutes = require('./analytics.routes');
// Other routes to be imported

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/content', broadcastRoutes); // mounts at /api/v1/content/live/:teacherId
router.use('/content', contentRoutes);
router.use('/approval', approvalRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
