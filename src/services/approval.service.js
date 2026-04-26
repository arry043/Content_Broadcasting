const { Content, ContentSlot, ContentSchedule, User } = require('../models');
const AppError = require('../utils/AppError');
const cacheService = require('./cache.service');

exports.approveContent = async (contentId, principalId) => {
  const content = await Content.findByPk(contentId);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  if (content.status !== 'pending') {
    throw new AppError('Only pending content can be approved', 400);
  }

  content.status = 'approved';
  content.approved_by = principalId;
  content.approved_at = new Date();
  await content.save();

  // Find or create ContentSlot for the subject
  let [slot] = await ContentSlot.findOrCreate({
    where: { subject: content.subject },
  });

  // Get MAX(rotation_order) for this slot
  const maxRotationOrder = await ContentSchedule.max('rotation_order', {
    where: { slot_id: slot.id },
  });

  const nextRotationOrder = isNaN(maxRotationOrder) ? 1 : maxRotationOrder + 1;

  // Create ContentSchedule
  await ContentSchedule.create({
    content_id: content.id,
    slot_id: slot.id,
    rotation_order: nextRotationOrder,
    duration_minutes: content.duration_minutes || 5,
  });

  // Invalidate cache
  await cacheService.delPattern(`live:teacher:${content.uploaded_by}*`);

  return content;
};

exports.rejectContent = async (contentId, principalId, rejectionReason) => {
  const content = await Content.findByPk(contentId);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  if (content.status !== 'pending') {
    throw new AppError('Only pending content can be rejected', 400);
  }

  content.status = 'rejected';
  content.rejection_reason = rejectionReason;
  content.approved_by = principalId; // Though rejected, we might track who rejected it here or in a separate column
  await content.save();

  // Invalidate cache
  await cacheService.delPattern(`live:teacher:${content.uploaded_by}*`);

  return content;
};
