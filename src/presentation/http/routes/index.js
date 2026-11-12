const { Router } = require('express');
const { createHealthRouter } = require('./health');
const { createEventRoutes } = require('./events');
const { createInviteRoutes } = require('./invites');
const { createOrganizerRoutes } = require('./organizers');

function createRoutes({
  checkDatabase,
  eventController,
  inviteController,
  guestController,
  giftController,
  publicInviteController,
  organizerController,
  authenticate,
  publicLimits,
}) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ status: 'API no ar' });
  });

  router.use('/health', createHealthRouter({ checkDatabase }));
  router.use(
    '/events',
    createEventRoutes({
      eventController,
      inviteController,
      guestController,
      giftController,
      authenticate,
    }),
  );
  router.use('/invites', createInviteRoutes({ publicInviteController, publicLimits }));
  router.use('/organizers', createOrganizerRoutes({ organizerController, authenticate }));

  return router;
}

module.exports = { createRoutes };
