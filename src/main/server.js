const { port } = require('../infrastructure/config/env');
const { createApp } = require('./app');
const { createRateLimitStore } = require('./rateLimitStore');

const app = createApp({ rateLimitStore: createRateLimitStore() });

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
