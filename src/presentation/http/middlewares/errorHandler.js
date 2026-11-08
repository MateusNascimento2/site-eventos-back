function notFound(req, res) {
  res.status(404).json({ error: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  let message = status === 500 ? 'Erro interno do servidor' : err.message;

  // Erros do leitor de JSON do Express chegam em inglês
  if (err.type === 'entity.parse.failed') message = 'JSON inválido';
  else if (err.type === 'entity.too.large') message = 'Corpo da requisição grande demais';
  else if (err.type) message = 'Requisição inválida';

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
