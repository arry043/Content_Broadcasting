const { Content } = require('../models');
const uploadService = require('../services/upload.service');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');
const { deleteFile } = require('../utils/fileUtils');

exports.uploadContent = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('File is required', 400);
    }

    const { title, subject, description, start_time, end_time, duration_minutes } = req.body;

    const { file_url, file_type, file_size } = await uploadService.uploadFile(req.file);

    const content = await Content.create({
      title,
      description,
      subject,
      file_url,
      file_type,
      file_size,
      start_time: start_time || null,
      end_time: end_time || null,
      duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : 5, // We will use this during approval
      uploaded_by: req.user.id,
      status: 'pending',
    });

    // Note: Since duration_minutes is needed for scheduling but belongs to ContentSchedule,
    // we can either add a temporary column on Content or pass it dynamically. 
    // Wait, the DB schema for Content doesn't have duration_minutes. I need to store it somewhere
    // until approval. Let's add it to description as JSON or add a column if needed.
    // The requirement says: "Store duration_minutes in the record for later use when creating ContentSchedule on approval"
    // But in `database_design` -> `Content`, duration_minutes is NOT a column.
    // Let me update the Content model to include duration_minutes.
    // I will do that via multi_replace_file_content in the next step.

    return successResponse(res, 201, 'Content uploaded successfully', { content });
  } catch (error) {
    if (req.file) {
      // Cleanup if DB fails
      deleteFile(req.file.path).catch(console.error);
    }
    next(error);
  }
};

exports.getMyContent = async (req, res, next) => {
  try {
    const { status, subject, page = 1, limit = 10 } = req.query;

    const where = { uploaded_by: req.user.id };
    if (status) where.status = status;
    if (subject) where.subject = subject;

    const offset = (page - 1) * limit;

    const { count, rows } = await Content.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
    });

    return successResponse(res, 200, 'Content retrieved successfully', {
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

exports.getMyContentById = async (req, res, next) => {
  try {
    const content = await Content.findOne({
      where: { id: req.params.id, uploaded_by: req.user.id },
    });

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    return successResponse(res, 200, 'Content retrieved successfully', { content });
  } catch (error) {
    next(error);
  }
};

exports.deleteMyContent = async (req, res, next) => {
  try {
    const content = await Content.findOne({
      where: { id: req.params.id, uploaded_by: req.user.id },
    });

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    if (content.status === 'approved') {
      throw new AppError('Cannot delete approved content', 400);
    }

    await deleteFile(content.file_url);
    await content.destroy();

    return successResponse(res, 200, 'Content deleted successfully');
  } catch (error) {
    next(error);
  }
};
