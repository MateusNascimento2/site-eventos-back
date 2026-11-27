const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { createRateLimit } = require('../../src/presentation/http/middlewares/rateLimit');
const { createRateLimitStore } = require('../../src/main/rateLimitStore');
const {
  FirestoreRateLimitStore,
} = require('../../src/infrastructure/repositories/FirestoreRateLimitStore');
const { FakeFirestore } = require('../helpers/FakeFirestore');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');

const JANELA = 60000;
const FOLGADO = { max: 1000, windowMs: JANELA };

function criarApp(rateLimitStore, limites = {}) {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository: new InMemoryGuestRepository(),
      verifyToken: async () => ({ uid: 'uid-a', email: 'a@teste.com' }),
    }),
    publicLimits: { read: FOLGADO, write: FOLGADO, ...limites.public },
    protectedLimits: { ip: FOLGADO, read: FOLGADO, write: FOLGADO, admin: FOLGADO, ...limites },
    rateLimitStore,
  });
}

function resposta() {
  return { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('createRateLimit com store', () => {
  it('usa a contagem do store e bloqueia acima do limite', async () => {
    const hit = jest
      .fn()
      .mockResolvedValueOnce({ total: 1, fim: 5000 })
      .mockResolvedValueOnce({ total: 2, fim: 5000 });
    const limite = createRateLimit({
      name: 'teste',
      max: 1,
      windowMs: 1000,
      now: () => 1000,
      store: { hit },
    });
    const res = resposta();
    const next = jest.fn();

    await limite({ ip: 'a' }, res, next);
    await limite({ ip: 'a' }, res, next);

    expect(hit).toHaveBeenCalledWith('teste:a', { windowMs: 1000, max: 1, agora: 1000 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith('Retry-After', '4');
  });

  it('se o store falhar, segue contando na memória sem derrubar a requisição', async () => {
    const onError = jest.fn();
    const limite = createRateLimit({
      max: 1,
      windowMs: 1000,
      store: { hit: jest.fn().mockRejectedValue(new Error('Firestore fora do ar')) },
      onError,
    });
    const res = resposta();
    const next = jest.fn();

    await limite({ ip: 'a' }, res, next);
    await limite({ ip: 'a' }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});

describe('limite guardado no Firestore', () => {
  it('duas instâncias da API compartilham a mesma contagem', async () => {
    const store = new FirestoreRateLimitStore(new FakeFirestore());
    const instanciaA = criarApp(store, { public: { read: { max: 2, windowMs: JANELA } } });
    const instanciaB = criarApp(store, { public: { read: { max: 2, windowMs: JANELA } } });

    expect((await request(instanciaA).get('/invites/AAAAAAAAAAAA')).status).toBe(404);
    expect((await request(instanciaB).get('/invites/AAAAAAAAAAAA')).status).toBe(404);
    expect((await request(instanciaA).get('/invites/AAAAAAAAAAAA')).status).toBe(429);
  });

  it('sem store, cada instância conta separado', async () => {
    const instanciaA = criarApp(null, { public: { read: { max: 1, windowMs: JANELA } } });
    const instanciaB = criarApp(null, { public: { read: { max: 1, windowMs: JANELA } } });

    await request(instanciaA).get('/invites/AAAAAAAAAAAA');

    expect((await request(instanciaB).get('/invites/AAAAAAAAAAAA')).status).toBe(404);
  });

  it('vale para as rotas protegidas, por usuário', async () => {
    const store = new FirestoreRateLimitStore(new FakeFirestore());
    const app = criarApp(store, { read: { max: 1, windowMs: JANELA } });
    const listar = () => request(app).get('/events').set('Authorization', 'Bearer x');

    expect((await listar()).status).toBe(200);
    expect((await listar()).status).toBe(429);
  });

  it('os limites de rotas diferentes têm contadores separados', async () => {
    const store = new FirestoreRateLimitStore(new FakeFirestore());
    const app = criarApp(store, { public: { write: { max: 1, windowMs: JANELA } } });
    const corpo = { name: 'Ana', email: 'ana@teste.com', phone: '21999998888', confirmed: true };

    await request(app).post('/invites/AAAAAAAAAAAA/rsvp').send(corpo);
    const bloqueada = await request(app).post('/invites/AAAAAAAAAAAA/rsvp').send(corpo);
    const leitura = await request(app).get('/invites/AAAAAAAAAAAA');

    expect(bloqueada.status).toBe(429);
    expect(leitura.status).toBe(404);
  });

  it('segue funcionando quando o Firestore falha', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const dbQuebrado = {
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async () => {
        throw new Error('sem conexão');
      },
    };
    const app = criarApp(new FirestoreRateLimitStore(dbQuebrado));

    const res = await request(app).get('/invites/AAAAAAAAAAAA');

    expect(res.status).toBe(404);
    console.error.mockRestore();
  });
});

describe('createRateLimitStore', () => {
  it('usa o Firestore por padrão', () => {
    expect(createRateLimitStore({})).toBeInstanceOf(FirestoreRateLimitStore);
  });

  it('RATE_LIMIT_STORE=memory desliga o store', () => {
    expect(createRateLimitStore({ RATE_LIMIT_STORE: 'memory' })).toBeNull();
  });
});
