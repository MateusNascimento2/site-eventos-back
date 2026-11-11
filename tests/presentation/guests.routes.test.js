const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');

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

async function criarApp() {
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository: new InMemoryGuestRepository(),
      verifyToken,
    }),
  });
  await comToken(request(app).post('/events')).send(evento);
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  return { app, slug: convite.body.slug };
}

let contador = 0;
const confirmar = (app, slug, extra) => {
  contador += 1;
  return request(app)
    .post(`/invites/${slug}/rsvp`)
    .send({
      name: `Convidado ${contador}`,
      email: `convidado${contador}@teste.com`,
      phone: '21987654321',
      confirmed: true,
      ...extra,
    });
};

describe('GET /events/:id/guests', () => {
  it('exige autenticação', async () => {
    const { app } = await criarApp();

    expect((await request(app).get('/events/evento-1/guests')).status).toBe(401);
  });

  it('devolve lista vazia quando ninguém respondeu', async () => {
    const { app } = await criarApp();

    const res = await comToken(request(app).get('/events/evento-1/guests'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lista os convidados com contato, do mais antigo ao mais novo, sem cache', async () => {
    const { app, slug } = await criarApp();
    await confirmar(app, slug, { name: 'Ana', email: 'ana@teste.com', plusOne: true });
    await confirmar(app, slug, { name: 'Bruno', confirmed: false });

    const res = await comToken(request(app).get('/events/evento-1/guests'));

    expect(res.status).toBe(200);
    expect(res.body.map((g) => g.name)).toEqual(['Ana', 'Bruno']);
    expect(res.body[0]).toMatchObject({
      name: 'Ana',
      email: 'ana@teste.com',
      phone: '21987654321',
      confirmed: true,
      plusOne: true,
    });
    expect(res.body[0].id).toEqual(expect.any(String));
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('filtra por confirmed=true e confirmed=false', async () => {
    const { app, slug } = await criarApp();
    await confirmar(app, slug, { name: 'Vai' });
    await confirmar(app, slug, { name: 'Nao vai', confirmed: false });

    const vao = await comToken(request(app).get('/events/evento-1/guests?confirmed=true'));
    const naoVao = await comToken(request(app).get('/events/evento-1/guests?confirmed=false'));

    expect(vao.body.map((g) => g.name)).toEqual(['Vai']);
    expect(naoVao.body.map((g) => g.name)).toEqual(['Nao vai']);
  });

  it('retorna 400 para filtro inválido', async () => {
    const { app } = await criarApp();

    for (const consulta of ['confirmed=talvez', 'confirmed=', 'confirmed=true&confirmed=false']) {
      const res = await comToken(request(app).get(`/events/evento-1/guests?${consulta}`));
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'confirmed deve ser true ou false' });
    }
  });

  it('retorna 404 para evento de outro organizador, inexistente ou id inválido', async () => {
    const { app } = await criarApp();

    const alheio = await comToken(request(app).get('/events/evento-1/guests'), 'token-b');
    const inexistente = await comToken(request(app).get('/events/nao-existe/guests'));
    const invalido = await comToken(request(app).get('/events/..%2Fx/guests'));

    for (const res of [alheio, inexistente, invalido]) {
      expect(res.status).toBe(404);
    }
    expect(alheio.body).toEqual({ error: 'Evento não encontrado' });
  });
});

describe('GET /events/:id/summary', () => {
  it('exige autenticação', async () => {
    const { app } = await criarApp();

    expect((await request(app).get('/events/evento-1/summary')).status).toBe(401);
  });

  it('devolve zeros quando ninguém respondeu', async () => {
    const { app } = await criarApp();

    const res = await comToken(request(app).get('/events/evento-1/summary'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, confirmed: 0, declined: 0, plusOnes: 0, attending: 0 });
  });

  it('conta respostas, confirmados, recusas, acompanhantes e total de presentes', async () => {
    const { app, slug } = await criarApp();
    await confirmar(app, slug, { plusOne: true });
    await confirmar(app, slug, { plusOne: true });
    await confirmar(app, slug);
    await confirmar(app, slug, { confirmed: false });

    const res = await comToken(request(app).get('/events/evento-1/summary'));

    expect(res.body).toEqual({ total: 4, confirmed: 3, declined: 1, plusOnes: 2, attending: 5 });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('retorna 404 para evento de outro organizador', async () => {
    const { app } = await criarApp();

    const res = await comToken(request(app).get('/events/evento-1/summary'), 'token-b');

    expect(res.status).toBe(404);
  });
});
