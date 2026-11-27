const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');

function criarApp() {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      verifyToken: async () => ({ uid: 'uid-a', email: 'a@teste.com' }),
    }),
  });
}

describe('headers de segurança (helmet)', () => {
  it('manda os headers de proteção em todas as respostas', async () => {
    const res = await request(criarApp()).get('/');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('também vale para erros e rotas inexistentes', async () => {
    const res = await request(criarApp()).get('/nao-existe');

    expect(res.status).toBe(404);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('libera a leitura da API por outras origens (CORP cross-origin) e mantém o CORS', async () => {
    const res = await request(criarApp()).get('/layouts').set('Origin', 'http://localhost:5173');

    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('a resposta de preflight continua funcionando', async () => {
    const res = await request(criarApp())
      .options('/events')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
  });
});

describe('segurança da página /docs', () => {
  it('libera só o CDN do Swagger UI e não usa script inline', async () => {
    const res = await request(criarApp()).get('/docs');
    const csp = res.headers['content-security-policy'];
    const scripts = csp.split(';').find((parte) => parte.trim().startsWith('script-src'));

    expect(scripts).toContain('https://cdn.jsdelivr.net');
    expect(scripts).not.toContain('unsafe-inline');
    expect(csp).not.toContain('upgrade-insecure-requests');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.text).not.toMatch(/<script>/);
    expect(res.text).toContain('/docs/swagger-init.js');
  });

  it('serve o script de inicialização', async () => {
    const res = await request(criarApp()).get('/docs/swagger-init.js');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('SwaggerUIBundle');
    expect(res.text).toContain('/docs/openapi.json');
  });
});
