const { Content, User } = require('../models');
const approvalService = require('../services/approval.service');
const { successResponse } = require('../utils/response');

exports.getPendingContent = async (req, res, next) => {
  try {
    const { subject, teacher_id, page = 1, limit = 10 } = req.query;

    const where = { status: 'pending' };
    if (subject) where.subject = subject;
    if (teacher_id) where.uploaded_by = teacher_id;

    const offset = (page - 1) * limit;

    const { count, rows } = await Content.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'ASC']],
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      ],
    });

    return successResponse(res, 200, 'Pending content retrieved', {
      content: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllContent = async (req, res, next) => {
  try {
    const { status, subject, teacher_id, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (subject) where.subject = subject;
    if (teacher_id) where.uploaded_by = teacher_id;

    const offset = (page - 1) * limit;

    const { count, rows } = await Content.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      ],
    });

    return successResponse(res, 200, 'All content retrieved', {
      content: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.approveContent = async (req, res, next) => {
  try {
    const content = await approvalService.approveContent(req.params.contentId, req.user.id);
    return successResponse(res, 200, 'Content approved', { content });
  } catch (error) {
    next(error);
  }
};

exports.rejectContent = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;
    const content = await approvalService.rejectContent(req.params.contentId, req.user.id, rejection_reason);
    return successResponse(res, 200, 'Content rejected', { content });
  } catch (error) {
    next(error);
  }
};
