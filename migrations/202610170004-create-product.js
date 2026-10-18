'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      value: { type: Sequelize.DOUBLE, allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'category', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      image_url: { type: Sequelize.STRING, allowNull: true }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product');
  }
};
