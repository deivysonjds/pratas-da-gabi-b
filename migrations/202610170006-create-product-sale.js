'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_sale', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sale', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'product', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }
    });
    await queryInterface.addIndex('product_sale', ['sale_id']);
    await queryInterface.addIndex('product_sale', ['product_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_sale');
  }
};
