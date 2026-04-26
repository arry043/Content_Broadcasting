const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentSlot extends Model {}

  ContentSlot.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      subject: {
        type: DataTypes.ENUM('Maths', 'Science', 'English', 'History', 'Geography', 'Other'),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'ContentSlot',
      tableName: 'ContentSlots',
      createdAt: 'created_at',
      updatedAt: false, // We will manually add created_at if needed, or use Sequelize's default
    }
  );

  return ContentSlot;
};
