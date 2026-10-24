const { Router } = require('express');

function createEventRoutes({ eventController, authenticate }) {
  const router = Router();

  router.use(authenticate);
  router.post('/', eventController.create);
  router.get('/', eventController.list);
  router.get('/:id', eventController.getById);

  return router;
}

module.exports = { createEventRoutes };
