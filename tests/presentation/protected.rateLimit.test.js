const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { createRateLimit } = require('../../src/presentation/http/middlewares/rateLimit');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');
const { InMemoryGiftRepository } = require('../helpers/InMemoryGiftRepository');
const { InMemoryAuditLogRepository } = require('../helpers/InMemoryAuditLogRepository');

const JANELA = 60000;
const FOLGADO = { max: 1000, windowMs: JANELA };

const usuarios = {
  'token-a': { uid: 'uid-a', email: 'a@teste.com' },
  'token-b': { uid: 'uid-b', email: 'b@teste.com' },
  'token-admin': { uid: 'uid-admin', email: 'admin@teste.com', admin: true },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('inválido');
  return usuarios[token];
};

function criarApp(protectedLimits = {}) {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      organizerRepository: new InMemoryOrganizerRepository(),
      guestRepository: new InMemoryGuestRepository(),
      giftRepository: new InMemoryGiftRepository(),
      auditLogRepository: new InMemoryAuditLogRepository(),
      verifyToken,
    }),
    protectedLimits: {
      ip: FOLGADO,
      read: FOLGADO,
      write: FOLGADO,
      admin: FOLGADO,
      ...protectedLimits,
    },
  });
}

const como = (req, token) => req.set('Authorization', `Bearer ${token}`);

describe('limite das rotas protegidas', () => {
  it('bloqueia leituras acima do limite do usuário com 429 e Retry-After', async () => {
    const app = criarApp({ read: { max: 2, windowMs: JANELA } });

    expect((await como(request(app).get('/events'), 'token-a')).status).toBe(200);
    expect((await como(request(app).get('/events'), 'token-a')).status).toBe(200);
    const bloqueada = await como(request(app).get('/events'), 'token-a');

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toEqual({
      error: 'Muitas requisições, tente novamente em alguns minutos',
    });
    expect(Number(bloqueada.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('conta as escritas separado das leituras', async () => {
    const app = criarApp({ write: { max: 1, windowMs: JANELA } });
    const corpo = { title: 'Festa', date: '2026-12-20', location: 'Rio' };

    expect((await como(request(app).post('/events'), 'token-a').send(corpo)).status).toBe(201);
    expect((await como(request(app).post('/events'), 'token-a').send(corpo)).status).toBe(429);
    expect((await como(request(app).get('/events'), 'token-a')).status).toBe(200);
  });

  it('cada usuário tem o seu próprio limite', async () => {
    const app = criarApp({ read: { max: 1, windowMs: JANELA } });

    await como(request(app).get('/events'), 'token-a');
    const outraVez = await como(request(app).get('/events'), 'token-a');
    const outroUsuario = await como(request(app).get('/events'), 'token-b');

    expect(outraVez.status).toBe(429);
    expect(outroUsuario.status).toBe(200);
  });

  it('limita por IP antes de validar o token', async () => {
    const app = criarApp({ ip: { max: 2, windowMs: JANELA } });

    const primeira = await como(request(app).get('/events'), 'token-invalido');
    const segunda = await como(request(app).get('/events'), 'token-invalido');
    const terceira = await como(request(app).get('/events'), 'token-invalido');

    expect(primeira.status).toBe(401);
    expect(segunda.status).toBe(401);
    expect(terceira.status).toBe(429);
  });

  it('vale também para as rotas de organizadores', async () => {
    const app = criarApp({ read: { max: 1, windowMs: JANELA } });

    await como(request(app).get('/organizers/me'), 'token-a');
    const res = await como(request(app).get('/organizers/me'), 'token-a');

    expect(res.status).toBe(429);
  });

  it('não afeta as rotas públicas', async () => {
    const app = criarApp({
      ip: { max: 1, windowMs: JANELA },
      read: { max: 1, windowMs: JANELA },
    });

    await como(request(app).get('/events'), 'token-a');
    await como(request(app).get('/events'), 'token-a');

    expect((await request(app).get('/layouts')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
  });
});

describe('limite das rotas de administrador', () => {
  it('bloqueia o administrador acima do limite do admin', async () => {
    const app = criarApp({ admin: { max: 2, windowMs: JANELA } });

    expect((await como(request(app).get('/admin/summary'), 'token-admin')).status).toBe(200);
    expect((await como(request(app).get('/admin/events'), 'token-admin')).status).toBe(200);
    const bloqueada = await como(request(app).get('/admin/organizers'), 'token-admin');

    expect(bloqueada.status).toBe(429);
  });

  it('o limite do admin não bloqueia as rotas normais dele', async () => {
    const app = criarApp({ admin: { max: 1, windowMs: JANELA } });

    await como(request(app).get('/admin/summary'), 'token-admin');
    await como(request(app).get('/admin/summary'), 'token-admin');

    expect((await como(request(app).get('/events'), 'token-admin')).status).toBe(200);
  });

  it('não administrador continua recebendo 403 e não gasta o limite do admin', async () => {
    const app = criarApp({ admin: { max: 1, windowMs: JANELA } });

    const res = await como(request(app).get('/admin/summary'), 'token-a');
    const outra = await como(request(app).get('/admin/summary'), 'token-a');

    expect(res.status).toBe(403);
    expect(outra.status).toBe(403);
  });
});

describe('createRateLimit com chave própria', () => {
  it('separa os contadores pela chave informada', () => {
    const limite = createRateLimit({ max: 1, windowMs: 1000, key: (req) => req.user.uid });
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    limite({ ip: 'x', user: { uid: 'a' } }, res, next);
    limite({ ip: 'x', user: { uid: 'b' } }, res, next);
    limite({ ip: 'y', user: { uid: 'a' } }, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
