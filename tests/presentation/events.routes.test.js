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

function criarApp() {
  const eventRepository = new InMemoryEventRepository();
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository, verifyToken }),
  });
}

describe('POST /events', () => {
  it('exige autenticação', async () => {
    const res = await request(criarApp()).post('/events').send(evento);

    expect(res.status).toBe(401);
  });

  it('cria o evento para o organizador do token', async () => {
    const res = await request(criarApp())
      .post('/events')
      .set('Authorization', 'Bearer token-a')
      .send(evento);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'evento-1', organizerId: 'uid-a', title: 'Casamento' });
  });

  it('ignora organizerId, pixKey e slug enviados no corpo', async () => {
    const res = await request(criarApp())
      .post('/events')
      .set('Authorization', 'Bearer token-a')
      .send({ ...evento, organizerId: 'uid-hacker', pixKey: 'x', slug: 'y' });

    expect(res.status).toBe(201);
    expect(res.body.organizerId).toBe('uid-a');
    expect(res.body.pixKey).toBeNull();
    expect(res.body.slug).toBeNull();
  });

  it('retorna 400 com dados inválidos', async () => {
    const app = criarApp();
    const semTitulo = await request(app)
      .post('/events')
      .set('Authorization', 'Bearer token-a')
      .send({ ...evento, title: '' });
    const semCorpo = await request(app).post('/events').set('Authorization', 'Bearer token-a');

    expect(semTitulo.status).toBe(400);
    expect(semTitulo.body).toEqual({ error: 'title é obrigatório' });
    expect(semCorpo.status).toBe(400);
  });
});

describe('GET /events', () => {
  it('exige autenticação', async () => {
    const res = await request(criarApp()).get('/events');

    expect(res.status).toBe(401);
  });

  it('lista só os eventos do organizador logado', async () => {
    const app = criarApp();
    const criar = (token, title) =>
      request(app)
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...evento, title });

    await criar('token-a', 'Do A 1');
    await criar('token-a', 'Do A 2');
    await criar('token-b', 'Do B');

    const res = await request(app).get('/events').set('Authorization', 'Bearer token-a');

    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.title)).toEqual(['Do A 1', 'Do A 2']);
  });

  it('devolve lista vazia quando não há eventos', async () => {
    const res = await request(criarApp()).get('/events').set('Authorization', 'Bearer token-a');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /events/:id', () => {
  it('devolve o evento do próprio organizador', async () => {
    const app = criarApp();
    await request(app).post('/events').set('Authorization', 'Bearer token-a').send(evento);

    const res = await request(app).get('/events/evento-1').set('Authorization', 'Bearer token-a');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Casamento');
  });

  it('retorna 404 para evento de outro organizador, sem revelar que existe', async () => {
    const app = criarApp();
    await request(app).post('/events').set('Authorization', 'Bearer token-a').send(evento);

    const res = await request(app).get('/events/evento-1').set('Authorization', 'Bearer token-b');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Evento não encontrado' });
  });

  it('retorna 404 para evento inexistente e para id com formato inválido', async () => {
    const app = criarApp();
    const inexistente = await request(app)
      .get('/events/nao-existe')
      .set('Authorization', 'Bearer token-a');
    const invalido = await request(app).get('/events/..').set('Authorization', 'Bearer token-a');

    expect(inexistente.status).toBe(404);
    expect(invalido.status).toBe(404);
  });

  it('exige autenticação', async () => {
    const res = await request(criarApp()).get('/events/evento-1');

    expect(res.status).toBe(401);
  });
});
