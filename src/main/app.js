const express = require('express');
const cors = require('cors');
const routes = require('../presentation/http/routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(routes);

  return app;
}

module.exports = { createApp };
