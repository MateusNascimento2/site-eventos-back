const { Router } = require('express');
const { LAYOUTS } = require('../../../domain/layouts');
const { createRateLimit } = require('../middlewares/rateLimit');

function createLayoutRoutes({ publicLimits }) {
  const router = Router();

  router.get('/', createRateLimit(publicLimits.read), (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(LAYOUTS);
  });

  return router;
}

module.exports = { createLayoutRoutes };
