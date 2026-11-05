const { Router } = require('express');

// Rotas públicas: o convidado não faz login
function createInviteRoutes({ publicInviteController }) {
  const router = Router();

  router.get('/:slug', publicInviteController.get);

  return router;
}

module.exports = { createInviteRoutes };
