const crypto = require('crypto');
const path = require('path');
const supabase = require('../config/supabase');

const bucket = process.env.SUPABASE_BUCKET || 'products';
const allowedTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

async function uploadProductImage(file) {
  if (!file || !allowedTypes[file.mimetype]) {
    throw new Error('Formato de imagem inválido. Use JPG, PNG ou WebP.');
  }

  const fileName = `${crypto.randomUUID()}${allowedTypes[file.mimetype]}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (error) throw new Error(`Falha no upload: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { fileName, imageUrl: data.publicUrl };
}

async function deleteProductImageByPath(fileName) {
  if (!fileName) return;
  const safeName = path.basename(fileName);
  const { error } = await supabase.storage.from(bucket).remove([safeName]);
  if (error) throw new Error(`Falha ao excluir imagem: ${error.message}`);
}

function extractPathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}

module.exports = { uploadProductImage, deleteProductImageByPath, extractPathFromPublicUrl };
