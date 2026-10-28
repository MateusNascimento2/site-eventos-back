const { Router } = require('express');

function createEventRoutes({ eventController, authenticate }) {
  const router = Router();

  router.use(authenticate);
  router.post('/', eventController.create);
  router.get('/', eventController.list);
  router.get('/:id', eventController.getById);
  router.put('/:id', eventController.update);
  router.delete('/:id', eventController.remove);

  return router;
}

module.exports = { createEventRoutes };
