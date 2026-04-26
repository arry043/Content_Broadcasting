const { Sequelize } = require('sequelize');
const { Analytics, Content, User } = require('../models');

exports.getSubjectsAnalytics = async () => {
  const analytics = await Analytics.findAll({
    attributes: [
      'subject',
      [Sequelize.fn('SUM', Sequelize.col('hit_count')), 'total_hits'],
    ],
    group: ['subject'],
    order: [[Sequelize.fn('SUM', Sequelize.col('hit_count')), 'DESC']],
  });

  return analytics;
};

exports.getContentAnalytics = async (contentId) => {
  const analytics = await Analytics.findOne({
    where: { content_id: contentId },
    include: [{ model: Content, attributes: ['id', 'title', 'subject', 'status'] }],
  });

  return analytics;
};

exports.getTeachersAnalytics = async () => {
  const analytics = await Analytics.findAll({
    attributes: [
      'teacher_id',
      [Sequelize.fn('SUM', Sequelize.col('hit_count')), 'total_hits'],
    ],
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
    ],
    group: ['teacher_id', 'User.id'],
    order: [[Sequelize.fn('SUM', Sequelize.col('hit_count')), 'DESC']],
  });

  return analytics;
};
