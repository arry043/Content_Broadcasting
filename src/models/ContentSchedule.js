const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentSchedule extends Model {}

  ContentSchedule.init(
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
      slot_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      rotation_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
    },
    {
      sequelize,
      modelName: 'ContentSchedule',
      tableName: 'ContentSchedules',
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ['content_id', 'slot_id'],
        },
      ],
    }
  );

  return ContentSchedule;
};
