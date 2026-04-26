'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ContentSchedules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      content_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Content',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ContentSlots',
          key: 'id',
        },
      },
      rotation_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('ContentSchedules', {
      fields: ['content_id', 'slot_id'],
      type: 'unique',
      name: 'unique_content_slot',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ContentSchedules');
  }
};
