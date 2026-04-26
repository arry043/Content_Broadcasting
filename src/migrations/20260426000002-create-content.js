'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      subject: {
        type: Sequelize.ENUM('Maths', 'Science', 'English', 'History', 'Geography', 'Other'),
        allowNull: false,
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_type: {
        type: Sequelize.ENUM('jpg', 'jpeg', 'png', 'gif'),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 5,
      },
      status: {
        type: Sequelize.ENUM('uploaded', 'pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('Content', ['uploaded_by', 'status']);
    await queryInterface.addIndex('Content', ['subject', 'status']);
    await queryInterface.addIndex('Content', ['start_time', 'end_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Content');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Content_subject";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Content_file_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Content_status";');
  }
};
