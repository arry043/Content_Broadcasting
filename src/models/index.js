const { sequelize } = require('../config/database');

const User = require('./User')(sequelize);
const Content = require('./Content')(sequelize);
const ContentSlot = require('./ContentSlot')(sequelize);
const ContentSchedule = require('./ContentSchedule')(sequelize);
const Analytics = require('./Analytics')(sequelize);

// Associations
Content.belongsTo(User, { foreignKey: 'uploaded_by', as: 'teacher' });
Content.belongsTo(User, { foreignKey: 'approved_by', as: 'principal' });

Content.hasOne(ContentSchedule, { foreignKey: 'content_id', onDelete: 'CASCADE' });
ContentSchedule.belongsTo(Content, { foreignKey: 'content_id' });

ContentSchedule.belongsTo(ContentSlot, { foreignKey: 'slot_id' });
ContentSlot.hasMany(ContentSchedule, { foreignKey: 'slot_id' });

Analytics.belongsTo(Content, { foreignKey: 'content_id' });
Analytics.belongsTo(User, { foreignKey: 'teacher_id' });

module.exports = {
  sequelize,
  User,
  Content,
  ContentSlot,
  ContentSchedule,
  Analytics,
};
