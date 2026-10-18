'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('installment', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sale', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      number: { type: Sequelize.INTEGER, allowNull: false },
      is_paid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      amount: { type: Sequelize.DOUBLE, allowNull: false }
    });
    await queryInterface.addIndex('installment', ['sale_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('installment');
  }
};
