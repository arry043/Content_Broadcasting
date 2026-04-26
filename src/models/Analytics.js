const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Analytics extends Model {}

  Analytics.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      content_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      teacher_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      hit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_served_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Analytics',
      tableName: 'Analytics',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Analytics;
};
