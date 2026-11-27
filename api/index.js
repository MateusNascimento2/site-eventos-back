// Entrada serverless da Vercel. Em desenvolvimento local, use `npm run dev` (index.js).
const { createApp } = require('../src/main/app');
const { createRateLimitStore } = require('../src/main/rateLimitStore');

module.exports = createApp({ rateLimitStore: createRateLimitStore() });
