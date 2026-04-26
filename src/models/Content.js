const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Content extends Model {}

  Content.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subject: {
        type: DataTypes.ENUM('Maths', 'Science', 'English', 'History', 'Geography', 'Other'),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.ENUM('jpg', 'jpeg', 'png', 'gif'),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
      },
      status: {
        type: DataTypes.ENUM('uploaded', 'pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Content',
      tableName: 'Content',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['uploaded_by', 'status'] },
        { fields: ['subject', 'status'] },
        { fields: ['start_time', 'end_time'] },
      ],
    }
  );

  return Content;
};
