const { Router } = require('express');
const { createRateLimit } = require('../middlewares/rateLimit');

function createInviteRoutes({ publicInviteController, publicLimits }) {
  const router = Router();
  const limitarLeitura = createRateLimit(publicLimits.read);
  const limitarEscrita = createRateLimit(publicLimits.write);

  router.get('/:slug', limitarLeitura, publicInviteController.get);
  router.get('/:slug/gifts', limitarLeitura, publicInviteController.gifts);
  router.post('/:slug/rsvp', limitarEscrita, publicInviteController.rsvp);

  return router;
}

module.exports = { createInviteRoutes };
