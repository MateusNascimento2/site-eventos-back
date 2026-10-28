const { Router } = require('express');
const { createHealthRouter } = require('./health');
const { createEventRoutes } = require('./events');
const { createOrganizerRoutes } = require('./organizers');

function createRoutes({ checkDatabase, eventController, organizerController, authenticate }) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ status: 'API no ar' });
  });

  router.use('/health', createHealthRouter({ checkDatabase }));
  router.use('/events', createEventRoutes({ eventController, authenticate }));
  router.use('/organizers', createOrganizerRoutes({ organizerController, authenticate }));

  return router;
}

module.exports = { createRoutes };
