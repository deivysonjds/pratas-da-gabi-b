'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id'], { name: 'refresh_tokens_user_id_idx' });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], { name: 'refresh_tokens_expires_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  }
};
