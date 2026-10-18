'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      cpf: { type: Sequelize.STRING, allowNull: false },
      contact: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client');
  }
};
