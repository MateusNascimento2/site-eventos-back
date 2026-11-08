const express = require('express');
const cors = require('cors');
const { createRoutes } = require('../presentation/http/routes');
const { notFound, errorHandler } = require('../presentation/http/middlewares/errorHandler');
const { checkDatabase: defaultCheckDatabase } = require('../infrastructure/firebase/healthCheck');
const { createCorsOrigin } = require('../presentation/http/middlewares/corsOrigins');
const { buildContainer } = require('./container');

const QUINZE_MINUTOS = 15 * 60 * 1000;
const LIMITES_PUBLICOS = {
  read: { max: 120, windowMs: QUINZE_MINUTOS },
  write: { max: 20, windowMs: QUINZE_MINUTOS },
};

function createApp({
  checkDatabase = defaultCheckDatabase,
  container = buildContainer(),
  corsOrigin = createCorsOrigin(),
  publicLimits = LIMITES_PUBLICOS,
} = {}) {
  const app = express();

  // Atrás do proxy da Vercel, o IP do cliente vem do header X-Forwarded-For
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '16kb' }));
  app.use(createRoutes({ checkDatabase, publicLimits, ...container }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
