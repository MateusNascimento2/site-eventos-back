const express = require('express');
const cors = require('cors');
const { createRoutes } = require('../presentation/http/routes');
const { notFound, errorHandler } = require('../presentation/http/middlewares/errorHandler');
const { checkDatabase: defaultCheckDatabase } = require('../infrastructure/firebase/healthCheck');
const { buildContainer } = require('./container');

function createApp({ checkDatabase = defaultCheckDatabase, container = buildContainer() } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(createRoutes({ checkDatabase, ...container }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
