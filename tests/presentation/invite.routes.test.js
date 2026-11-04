const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');

const usuarios = {
  'token-a': { uid: 'uid-a', email: 'a@teste.com' },
  'token-b': { uid: 'uid-b', email: 'b@teste.com' },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('token ruim');
  return usuarios[token];
};

const evento = { title: 'Casamento', date: '2026-12-01', location: 'Rio de Janeiro' };
const comToken = (req, token = 'token-a') => req.set('Authorization', `Bearer ${token}`);

async function criarApp({ frontendUrl = 'https://meu-site.vercel.app', generateSlug } = {}) {
  const eventRepository = new InMemoryEventRepository();
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository,
      verifyToken,
      getFrontendUrl: () => frontendUrl,
      ...(generateSlug ? { generateSlug } : {}),
    }),
  });
  await comToken(request(app).post('/events')).send(evento);
  return { app, eventRepository };
}

describe('POST /events/:id/invite', () => {
  it('exige autenticação', async () => {
    const { app } = await criarApp();

    const res = await request(app).post('/events/evento-1/invite');

    expect(res.status).toBe(401);
  });

  it('gera o slug e a url do convite (201)', async () => {
    const { app, eventRepository } = await criarApp();

    const res = await comToken(request(app).post('/events/evento-1/invite'));

    expect(res.status).toBe(201);
    expect(res.body.eventId).toBe('evento-1');
    expect(res.body.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(res.body.url).toBe(`https://meu-site.vercel.app/convite/${res.body.slug}`);
    expect((await eventRepository.findBySlug(res.body.slug)).id).toBe('evento-1');
  });

  it('devolve o mesmo link se o convite já existe (200)', async () => {
    const { app } = await criarApp();
    const primeiro = await comToken(request(app).post('/events/evento-1/invite'));

    const segundo = await comToken(request(app).post('/events/evento-1/invite'));

    expect(segundo.status).toBe(200);
    expect(segundo.body.slug).toBe(primeiro.body.slug);
  });

  it('devolve url null quando FRONTEND_URL não está configurada', async () => {
    const { app } = await criarApp({ frontendUrl: null });

    const res = await comToken(request(app).post('/events/evento-1/invite'));

    expect(res.status).toBe(201);
    expect(res.body.url).toBeNull();
  });

  it('aceita FRONTEND_URL com barra no final', async () => {
    const { app } = await criarApp({ frontendUrl: 'https://meu-site.vercel.app/' });

    const res = await comToken(request(app).post('/events/evento-1/invite'));

    expect(res.body.url).toBe(`https://meu-site.vercel.app/convite/${res.body.slug}`);
  });

  it('retorna 404 para evento de outro organizador e para inexistente, sem gerar slug', async () => {
    const { app, eventRepository } = await criarApp();

    const outro = await comToken(request(app).post('/events/evento-1/invite'), 'token-b');
    const inexistente = await comToken(request(app).post('/events/nao-existe/invite'));

    expect(outro.status).toBe(404);
    expect(inexistente.status).toBe(404);
    expect((await eventRepository.findById('evento-1')).slug).toBeNull();
  });

  it('tenta de novo quando o slug sorteado já está em uso', async () => {
    const sorteados = ['repetido-001', 'repetido-001', 'livre-000002'];
    const { app, eventRepository } = await criarApp({ generateSlug: () => sorteados.shift() });
    await comToken(request(app).post('/events')).send(evento);
    await comToken(request(app).post('/events/evento-1/invite'));

    const res = await comToken(request(app).post('/events/evento-2/invite'));

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('livre-000002');
    expect((await eventRepository.findById('evento-2')).slug).toBe('livre-000002');
  });
});

describe('POST /events/:id/invite/regenerate', () => {
  it('exige autenticação', async () => {
    const { app } = await criarApp();

    const res = await request(app).post('/events/evento-1/invite/regenerate');

    expect(res.status).toBe(401);
  });

  it('gera um slug novo e o link antigo deixa de existir', async () => {
    const { app, eventRepository } = await criarApp();
    const antigo = await comToken(request(app).post('/events/evento-1/invite'));

    const res = await comToken(request(app).post('/events/evento-1/invite/regenerate'));

    expect(res.status).toBe(200);
    expect(res.body.slug).not.toBe(antigo.body.slug);
    expect(await eventRepository.findBySlug(antigo.body.slug)).toBeNull();
    expect((await eventRepository.findBySlug(res.body.slug)).id).toBe('evento-1');
  });

  it('gera o primeiro slug se o convite ainda não existia', async () => {
    const { app } = await criarApp();

    const res = await comToken(request(app).post('/events/evento-1/invite/regenerate'));

    expect(res.status).toBe(200);
    expect(res.body.slug).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });

  it('retorna 404 para evento de outro organizador, sem alterar o convite', async () => {
    const { app } = await criarApp();
    const antigo = await comToken(request(app).post('/events/evento-1/invite'));

    const res = await comToken(request(app).post('/events/evento-1/invite/regenerate'), 'token-b');
    const continua = await comToken(request(app).post('/events/evento-1/invite'));

    expect(res.status).toBe(404);
    expect(continua.body.slug).toBe(antigo.body.slug);
  });
});
