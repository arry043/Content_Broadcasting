const schedulingService = require('../services/scheduling.service');
const cacheService = require('../services/cache.service');
const { User, Analytics } = require('../models');
const { successResponse } = require('../utils/response');

exports.getLiveContent = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    const cacheKey = `live:teacher:${teacherId}${subject ? `:subject:${subject}` : ''}`;
    const cachedResponse = await cacheService.get(cacheKey);

    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }

    // Validate teacher exists
    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' },
    });

    if (!teacher) {
      return res.status(200).json({ available: false, message: 'No content available' });
    }

    const activeContent = await schedulingService.getActiveContentForTeacher(teacherId, subject);

    if (!activeContent) {
      return res.status(200).json({ available: false, message: 'No content available' });
    }

    // Format response depending on if subject is filtered
    let contentToReturn;
    let rotationEndsAt;

    if (subject) {
      contentToReturn = {
        id: activeContent.content.id,
        title: activeContent.content.title,
        subject: activeContent.content.subject,
        file_url: activeContent.content.file_url,
        file_type: activeContent.content.file_type,
        description: activeContent.content.description,
        rotation_ends_at: activeContent.rotationEndsAt,
        approved_at: activeContent.content.approved_at,
      };
      rotationEndsAt = activeContent.rotationEndsAt;

      // Async increment hit count
      incrementHitCount(activeContent.content.id, activeContent.content.subject, teacherId);

    } else {
      // Return multiple subjects
      contentToReturn = activeContent.map(item => {
        incrementHitCount(item.content.id, item.content.subject, teacherId);
        return {
          id: item.content.id,
          title: item.content.title,
          subject: item.content.subject,
          file_url: item.content.file_url,
          file_type: item.content.file_type,
          description: item.content.description,
          rotation_ends_at: item.rotationEndsAt,
          approved_at: item.content.approved_at,
        };
      });
      // Rotation ends at is minimum of all, or we cache differently. We'll handle cache TTL in middleware/service.
      const minRotationEnd = Math.min(...activeContent.map(i => new Date(i.rotationEndsAt).getTime()));
      rotationEndsAt = new Date(minRotationEnd);
    }

    const responsePayload = {
      available: true,
      teacher: { id: teacher.id, name: teacher.name },
      active_content: contentToReturn,
    };

    const ttlSeconds = Math.max(1, Math.floor((new Date(rotationEndsAt).getTime() - new Date().getTime()) / 1000));
    await cacheService.set(cacheKey, responsePayload, ttlSeconds);

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

const incrementHitCount = async (contentId, subject, teacherId) => {
  try {
    const [analytics, created] = await Analytics.findOrCreate({
      where: { content_id: contentId },
      defaults: {
        subject,
        teacher_id: teacherId,
        hit_count: 1,
        last_served_at: new Date(),
      },
    });

    if (!created) {
      analytics.hit_count += 1;
      analytics.last_served_at = new Date();
      await analytics.save();
    }
  } catch (err) {
    console.error('Failed to increment analytics:', err);
  }
};
