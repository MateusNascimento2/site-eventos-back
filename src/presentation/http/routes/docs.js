const { Router } = require('express');
const { spec } = require('../openapi/openapiDocument');
const { createRateLimit } = require('../middlewares/rateLimit');

const PAGINA = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Site Eventos</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="/docs/swagger-init.js"></script>
  </body>
</html>
`;

const INICIAR = `window.ui = SwaggerUIBundle({
  url: '/docs/openapi.json',
  dom_id: '#swagger-ui',
  persistAuthorization: true,
});
`;

const CDN = 'https://cdn.jsdelivr.net';
const CSP_DOCS = [
  "default-src 'self'",
  `script-src 'self' ${CDN}`,
  `style-src 'self' 'unsafe-inline' ${CDN}`,
  `img-src 'self' data: ${CDN}`,
  `font-src 'self' data: ${CDN}`,
  "connect-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

function createDocsRoutes({ publicLimits }) {
  const router = Router();
  const limitarLeitura = createRateLimit(publicLimits.read);

  router.get('/', limitarLeitura, (req, res) => {
    res.set('Content-Security-Policy', CSP_DOCS);
    res.type('html').send(PAGINA);
  });

  router.get('/swagger-init.js', limitarLeitura, (req, res) => {
    res.type('js').send(INICIAR);
  });

  router.get('/openapi.json', limitarLeitura, (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(spec);
  });

  return router;
}

module.exports = { createDocsRoutes };
