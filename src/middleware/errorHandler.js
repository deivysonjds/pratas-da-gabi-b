function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'A imagem excede o limite de 5 MB.'
      : 'Erro ao receber o arquivo.';
    return res.status(400).json({ message });
  }

  if (error.message && error.message.startsWith('Formato inválido')) {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = errorHandler;
