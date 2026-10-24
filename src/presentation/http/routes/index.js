const { Router } = require('express');
const { createHealthRouter } = require('./health');
const { createEventRoutes } = require('./events');

function createRoutes({ checkDatabase, eventController, authenticate }) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ status: 'API no ar' });
  });

  router.use('/health', createHealthRouter({ checkDatabase }));
  router.use('/events', createEventRoutes({ eventController, authenticate }));

  return router;
}

module.exports = { createRoutes };
