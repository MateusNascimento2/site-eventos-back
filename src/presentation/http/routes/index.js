const { Router } = require('express');
const { createHealthRouter } = require('./health');

function createRoutes({ checkDatabase }) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ status: 'API no ar' });
  });

  router.use('/health', createHealthRouter({ checkDatabase }));

  return router;
}

module.exports = { createRoutes };
