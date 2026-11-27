const { Router } = require('express');
const { createHealthRouter } = require('./health');
const { createEventRoutes } = require('./events');
const { createInviteRoutes } = require('./invites');
const { createOrganizerRoutes } = require('./organizers');
const { createAdminRoutes } = require('./admin');
const { createLayoutRoutes } = require('./layouts');
const { createDocsRoutes } = require('./docs');
const { createRateLimit } = require('../middlewares/rateLimit');

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
  protectedLimits,
  rateLimitStore,
}) {
  const router = Router();

  const porUsuario = (req) => req.user.uid;
  const limitarIp = createRateLimit({
    ...protectedLimits.ip,
    name: 'protegidas-ip',
    store: rateLimitStore,
  });
  const limitarLeitura = createRateLimit({
    ...protectedLimits.read,
    name: 'usuario-leitura',
    key: porUsuario,
    store: rateLimitStore,
  });
  const limitarEscrita = createRateLimit({
    ...protectedLimits.write,
    name: 'usuario-escrita',
    key: porUsuario,
    store: rateLimitStore,
  });
  const limitarAdmin = createRateLimit({
    ...protectedLimits.admin,
    name: 'admin',
    key: porUsuario,
    store: rateLimitStore,
  });
  const limitarUsuario = (req, res, next) =>
    (req.method === 'GET' ? limitarLeitura : limitarEscrita)(req, res, next);
  const autenticarComLimite = [limitarIp, authenticate, limitarUsuario];

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
      authenticate: autenticarComLimite,
    }),
  );
  router.use(
    '/invites',
    createInviteRoutes({ publicInviteController, publicLimits, rateLimitStore }),
  );
  router.use('/layouts', createLayoutRoutes({ publicLimits }));
  router.use('/docs', createDocsRoutes({ publicLimits }));
  router.use(
    '/organizers',
    createOrganizerRoutes({ organizerController, authenticate: autenticarComLimite }),
  );
  router.use(
    '/admin',
    createAdminRoutes({
      adminController,
      authenticate: autenticarComLimite,
      requireAdmin: [requireAdmin, limitarAdmin],
    }),
  );

  return router;
}

module.exports = { createRoutes };
