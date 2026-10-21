const { port } = require('../infrastructure/config/env');
const { createApp } = require('./app');

const app = createApp();

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
