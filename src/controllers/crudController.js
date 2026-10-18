const { ValidationError, UniqueConstraintError } = require('sequelize');

function sendError(res, error) {
  if (error instanceof ValidationError || error instanceof UniqueConstraintError || error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ message: 'Há registros relacionados a este registro.' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

function createCrudController(Model, options = {}) {
  const fields = options.fields;
  const include = options.include || [];
  const beforeCreate = options.beforeCreate;
  const beforeUpdate = options.beforeUpdate;
  const afterDelete = options.afterDelete;
  const sanitize = options.sanitize || (record => record);

  function pick(body) {
    if (!fields) return { ...body };
    return Object.fromEntries(fields.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
  }

  return {
    async create(req, res) {
      try {
        const data = pick(req.body || {});
        if (beforeCreate) await beforeCreate(data, req);
        const record = await Model.create(data);
        return res.status(201).json(sanitize(record));
      } catch (error) { return sendError(res, error); }
    },

    async findAll(req, res) {
      try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
        const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
        const result = await Model.findAndCountAll({ include, order: [['id', 'ASC']], limit, offset, distinct: true });
        return res.json({ total: result.count, limit, offset, data: result.rows.map(sanitize) });
      } catch (error) { return sendError(res, error); }
    },

    async findById(req, res) {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido.' });
        const record = await Model.findByPk(id, { include });
        if (!record) return res.status(404).json({ message: 'Registro não encontrado.' });
        return res.json(sanitize(record));
      } catch (error) { return sendError(res, error); }
    },

    async update(req, res) {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido.' });
        const record = await Model.findByPk(id);
        if (!record) return res.status(404).json({ message: 'Registro não encontrado.' });
        const data = pick(req.body || {});
        if (beforeUpdate) await beforeUpdate(data, req, record);
        await record.update(data);
        const updated = include.length ? await Model.findByPk(id, { include }) : record;
        return res.json(sanitize(updated));
      } catch (error) { return sendError(res, error); }
    },

    async remove(req, res) {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido.' });
        const record = await Model.findByPk(id);
        if (!record) return res.status(404).json({ message: 'Registro não encontrado.' });
        if (afterDelete) await afterDelete(record);
        await record.destroy();
        return res.status(204).send();
      } catch (error) { return sendError(res, error); }
    }
  };
}

module.exports = { createCrudController, sendError };
