const { Router } = require('express');
const { createHealthRouter } = require('./health');
const { createEventRoutes } = require('./events');
const { createInviteRoutes } = require('./invites');
const { createOrganizerRoutes } = require('./organizers');
const { createAdminRoutes } = require('./admin');
const { createLayoutRoutes } = require('./layouts');
const { createDocsRoutes } = require('./docs');

function createRoutes({
  checkDatabase,
  eventController,
  inviteController,
  guestController,
  giftController,
  publicInviteController,
  organizerController,
  adminController,
  authenticate,
  requireAdmin,
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
  router.use('/layouts', createLayoutRoutes({ publicLimits }));
  router.use('/docs', createDocsRoutes({ publicLimits }));
  router.use('/organizers', createOrganizerRoutes({ organizerController, authenticate }));
  router.use('/admin', createAdminRoutes({ adminController, authenticate, requireAdmin }));

  return router;
}

module.exports = { createRoutes };
