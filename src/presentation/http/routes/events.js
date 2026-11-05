const { Router } = require('express');

function createEventRoutes({ eventController, inviteController, authenticate }) {
  const router = Router();

  router.use(authenticate);
  router.post('/', eventController.create);
  router.get('/', eventController.list);
  router.get('/:id', eventController.getById);
  router.put('/:id', eventController.update);
  router.delete('/:id', eventController.remove);
  router.post('/:id/invite', inviteController.create);
  router.post('/:id/invite/regenerate', inviteController.regenerate);
  router.delete('/:id/invite', inviteController.disable);

  return router;
}

module.exports = { createEventRoutes };
