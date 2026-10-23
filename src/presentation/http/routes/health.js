const { Router } = require('express');

function createHealthRouter({ checkDatabase }) {
  const router = Router();

  router.get('/firebase', async (req, res) => {
    try {
      await checkDatabase();
      res.json({ status: 'ok', firebase: 'conectado' });
    } catch (erro) {
      // O detalhe do erro fica só no log do servidor, nunca na resposta.
      console.error('Falha na verificação do Firebase:', erro.message);
      res.status(503).json({ status: 'erro', firebase: 'falha na conexão' });
    }
  });

  return router;
}

module.exports = { createHealthRouter };
