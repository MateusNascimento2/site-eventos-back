const { Router } = require('express');

function createOrganizerRoutes({ organizerController, authenticate }) {
  const router = Router();

  router.use(authenticate);
  router.post('/', organizerController.create);
  router.get('/me', organizerController.me);

  return router;
}

module.exports = { createOrganizerRoutes };
