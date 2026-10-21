function notFound(req, res) {
  res.status(404).json({ error: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor' : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
