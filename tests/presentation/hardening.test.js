const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');
const { createCorsOrigin } = require('../../src/presentation/http/middlewares/corsOrigins');
const { createRateLimit } = require('../../src/presentation/http/middlewares/rateLimit');

const verifyToken = async () => ({ uid: 'uid-a', email: 'a@teste.com' });

function criarApp(opcoes = {}) {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository: new InMemoryGuestRepository(),
      verifyToken,
    }),
    ...opcoes,
  });
}

describe('corpo da requisição', () => {
  it('JSON inválido devolve 400 em português, sem vazar o erro do parser', async () => {
    const res = await request(criarApp())
      .post('/invites/AAAAAAAAAAAA/rsvp')
      .set('Content-Type', 'application/json')
      .send('{ "name": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'JSON inválido' });
  });

  it('corpo acima do limite devolve 413', async () => {
    const res = await request(criarApp())
      .post('/invites/AAAAAAAAAAAA/rsvp')
      .send({ name: 'a'.repeat(20000) });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'Corpo da requisição grande demais' });
  });

  it('não informa a tecnologia no header X-Powered-By', async () => {
    const res = await request(criarApp()).get('/');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  const comOrigens = (env) => criarApp({ corsOrigin: createCorsOrigin(() => env) });
  const origem = (app, valor) => request(app).get('/').set('Origin', valor);

  it('libera só o front configurado e as origens extras', async () => {
    const app = comOrigens({
      FRONTEND_URL: 'https://meu-site.vercel.app/',
      CORS_ORIGINS: 'http://localhost:5173, lixo',
    });

    const front = await origem(app, 'https://meu-site.vercel.app');
    const local = await origem(app, 'http://localhost:5173');
    const outro = await origem(app, 'https://site-do-hacker.com');

    expect(front.headers['access-control-allow-origin']).toBe('https://meu-site.vercel.app');
    expect(local.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(outro.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('chamadas sem Origin (Postman, curl) continuam funcionando', async () => {
    const app = comOrigens({ FRONTEND_URL: 'https://meu-site.vercel.app' });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
  });

  it('sem nenhuma origem configurada libera todas (desenvolvimento)', async () => {
    const res = await origem(comOrigens({}), 'http://qualquer.com');

    expect(res.headers['access-control-allow-origin']).toBe('http://qualquer.com');
  });
});

describe('limite de requisições nas rotas públicas', () => {
  const limites = {
    read: { max: 3, windowMs: 60000 },
    write: { max: 2, windowMs: 60000 },
  };

  it('GET /invites/:slug devolve 429 com Retry-After depois do limite', async () => {
    const app = criarApp({ publicLimits: limites });
    const get = () => request(app).get('/invites/AAAAAAAAAAAA');

    for (let i = 0; i < 3; i++) expect((await get()).status).toBe(404);
    const bloqueado = await get();

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body).toEqual({
      error: 'Muitas requisições, tente novamente em alguns minutos',
    });
    expect(Number(bloqueado.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('POST /invites/:slug/rsvp tem limite próprio, mesmo com erro', async () => {
    const app = criarApp({ publicLimits: limites });
    const post = () => request(app).post('/invites/AAAAAAAAAAAA/rsvp').send({});

    expect((await post()).status).toBe(404);
    expect((await post()).status).toBe(404);
    expect((await post()).status).toBe(429);
    expect((await request(app).get('/invites/AAAAAAAAAAAA')).status).toBe(404);
  });

  it('cada IP tem a sua contagem', async () => {
    const app = criarApp({ publicLimits: limites });
    const get = (ip) => request(app).get('/invites/AAAAAAAAAAAA').set('X-Forwarded-For', ip);

    for (let i = 0; i < 3; i++) await get('1.1.1.1');

    expect((await get('1.1.1.1')).status).toBe(429);
    expect((await get('2.2.2.2')).status).toBe(404);
  });

  it('as rotas com login não entram no limite', async () => {
    const app = criarApp({ publicLimits: limites });

    for (let i = 0; i < 6; i++) {
      const res = await request(app).get('/events').set('Authorization', 'Bearer qualquer');
      expect(res.status).toBe(200);
    }
  });
});

describe('createRateLimit', () => {
  it('libera de novo quando a janela termina', () => {
    let agora = 1000;
    const limite = createRateLimit({ max: 1, windowMs: 100, now: () => agora });
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    limite({ ip: 'a' }, res, next);
    limite({ ip: 'a' }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);

    agora += 101;
    limite({ ip: 'a' }, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
