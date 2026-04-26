'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ContentSlots', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      subject: {
        type: Sequelize.ENUM('Maths', 'Science', 'English', 'History', 'Geography', 'Other'),
        allowNull: false,
        unique: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ContentSlots');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ContentSlots_subject";');
  }
};
