const { Router } = require('express');
const { createRateLimit } = require('../middlewares/rateLimit');

// Rotas públicas: o convidado não faz login, então cada IP tem um limite de requisições
function createInviteRoutes({ publicInviteController, publicLimits }) {
  const router = Router();
  const limitarLeitura = createRateLimit(publicLimits.read);
  const limitarEscrita = createRateLimit(publicLimits.write);

  router.get('/:slug', limitarLeitura, publicInviteController.get);
  router.post('/:slug/rsvp', limitarEscrita, publicInviteController.rsvp);

  return router;
}

module.exports = { createInviteRoutes };
