const { Router } = require('express');
const { createRateLimit } = require('../middlewares/rateLimit');

function createInviteRoutes({ publicInviteController, publicLimits, rateLimitStore }) {
  const router = Router();
  const limitarLeitura = createRateLimit({
    ...publicLimits.read,
    name: 'convite-leitura',
    store: rateLimitStore,
  });
  const limitarEscrita = createRateLimit({
    ...publicLimits.write,
    name: 'convite-rsvp',
    store: rateLimitStore,
  });

  router.get('/:slug', limitarLeitura, publicInviteController.get);
  router.get('/:slug/gifts', limitarLeitura, publicInviteController.gifts);
  router.post('/:slug/rsvp', limitarEscrita, publicInviteController.rsvp);

  return router;
}

module.exports = { createInviteRoutes };
