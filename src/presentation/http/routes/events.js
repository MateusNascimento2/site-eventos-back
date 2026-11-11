const { Router } = require('express');

function createEventRoutes({ eventController, inviteController, guestController, authenticate }) {
  const router = Router();

  router.use(authenticate);
  router.post('/', eventController.create);
  router.get('/', eventController.list);
  router.get('/:id', eventController.getById);
  router.put('/:id', eventController.update);
  router.delete('/:id', eventController.remove);
  router.get('/:id/guests', guestController.list);
  router.get('/:id/summary', guestController.summary);
  router.post('/:id/invite', inviteController.create);
  router.post('/:id/invite/regenerate', inviteController.regenerate);
  router.delete('/:id/invite', inviteController.disable);

  return router;
}

module.exports = { createEventRoutes };
