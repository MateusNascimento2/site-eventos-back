const { Router } = require('express');

function createAdminRoutes({ adminController, authenticate, requireAdmin }) {
  const router = Router();

  router.use(authenticate, requireAdmin);
  router.get('/organizers', adminController.organizers);
  router.get('/events', adminController.events);
  router.get('/summary', adminController.summary);
  router.post('/organizers/:id/disable', adminController.disableOrganizer);
  router.post('/organizers/:id/enable', adminController.enableOrganizer);
  router.delete('/events/:id/invite', adminController.disableInvite);
  router.delete('/events/:id', adminController.removeEvent);
  router.get('/audit-logs', adminController.auditLogs);

  return router;
}

module.exports = { createAdminRoutes };
