const multer = require('multer');
const { Product } = require('../models');
const {
  uploadProductImage,
  deleteProductImageByPath,
  extractPathFromPublicUrl
} = require('../services/storageService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Formato inválido. Use JPG, PNG ou WebP.'));
    }
    callback(null, true);
  }
});

async function uploadImage(req, res) {
  let uploaded = null;
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    if (!req.file) return res.status(400).json({ message: 'Envie o arquivo no campo "image".' });

    uploaded = await uploadProductImage(req.file);
    const oldPath = extractPathFromPublicUrl(product.image_url);

    try {
      await product.update({ image_url: uploaded.imageUrl });
    } catch (error) {
      await deleteProductImageByPath(uploaded.fileName).catch(() => {});
      throw error;
    }

    // A imagem anterior só é removida depois de atualizar o registro.
    if (oldPath && oldPath !== uploaded.fileName) {
      await deleteProductImageByPath(oldPath).catch(err => {
        console.error('Não foi possível remover a imagem anterior:', err.message);
      });
    }

    return res.json({ message: 'Imagem enviada com sucesso.', image_url: uploaded.imageUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Não foi possível enviar a imagem.' });
  }
}

module.exports = { upload, uploadImage };
