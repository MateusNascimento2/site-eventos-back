const express = require('express');
const cors = require('cors');
const routes = require('../presentation/http/routes');
const { notFound, errorHandler } = require('../presentation/http/middlewares/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
