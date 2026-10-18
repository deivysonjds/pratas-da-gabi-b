'use strict';

module.exports = {
  async up(queryInterface) {
    // A restrição pode ter sido criada como UNIQUE constraint (em vez de índice puro).
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'product'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) = 'UNIQUE (category_id)'
    `);

    for (const constraint of constraints) {
      await queryInterface.removeConstraint('product', constraint.conname);
    }

    // Remove também um índice único independente, se a instalação o criou assim.
    const indexes = await queryInterface.showIndex('product');
    for (const index of indexes) {
      const fields = (index.fields || []).map(field => field.attribute || field.name);
      const isConstraintIndex = constraints.some(constraint => constraint.conname === index.name);
      if (index.unique && fields.length === 1 && fields[0] === 'category_id' && !isConstraintIndex) {
        await queryInterface.removeIndex('product', index.name);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.addConstraint('product', {
      fields: ['category_id'],
      type: 'unique',
      name: 'product_category_id_unique',
    });
  }
};
