'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const principalPassword = await bcrypt.hash('principal@123', salt);
    const teacherPassword = await bcrypt.hash('teacher@123', salt);

    const users = [
      {
        id: uuidv4(),
        name: 'Principal Admin',
        email: 'principal@school.com',
        password_hash: principalPassword,
        role: 'principal',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Teacher One',
        email: 'teacher1@school.com',
        password_hash: teacherPassword,
        role: 'teacher',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Teacher Two',
        email: 'teacher2@school.com',
        password_hash: teacherPassword,
        role: 'teacher',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Teacher Three',
        email: 'teacher3@school.com',
        password_hash: teacherPassword,
        role: 'teacher',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    await queryInterface.bulkInsert('Users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
