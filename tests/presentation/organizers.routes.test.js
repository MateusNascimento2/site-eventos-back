const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');

const usuarios = {
  'token-a': { uid: 'uid-a', email: 'a@teste.com' },
  'token-b': { uid: 'uid-b', email: 'b@teste.com' },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('token ruim');
  return usuarios[token];
};

const comToken = (req, token = 'token-a') => req.set('Authorization', `Bearer ${token}`);

function criarApp() {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      organizerRepository: new InMemoryOrganizerRepository(),
      verifyToken,
    }),
  });
}

describe('POST /organizers', () => {
  it('exige autenticação', async () => {
    const res = await request(criarApp()).post('/organizers').send({ name: 'Ana' });

    expect(res.status).toBe(401);
  });

  it('cria o perfil com uid e e-mail do token', async () => {
    const res = await comToken(request(criarApp()).post('/organizers')).send({
      name: 'Ana Souza',
      email: 'outro@teste.com',
      id: 'uid-hacker',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'uid-a', name: 'Ana Souza', email: 'a@teste.com' });
  });

  it('retorna 400 sem nome', async () => {
    const app = criarApp();

    const semNome = await comToken(request(app).post('/organizers')).send({});
    const semCorpo = await comToken(request(app).post('/organizers'));

    expect(semNome.status).toBe(400);
    expect(semNome.body).toEqual({ error: 'name é obrigatório' });
    expect(semCorpo.status).toBe(400);
  });

  it('retorna 409 se o organizador já está cadastrado', async () => {
    const app = criarApp();
    await comToken(request(app).post('/organizers')).send({ name: 'Ana' });

    const res = await comToken(request(app).post('/organizers')).send({ name: 'Ana de novo' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Organizador já cadastrado' });
  });
});

describe('GET /organizers/me', () => {
  it('exige autenticação', async () => {
    const res = await request(criarApp()).get('/organizers/me');

    expect(res.status).toBe(401);
  });

  it('devolve o perfil de quem está logado', async () => {
    const app = criarApp();
    await comToken(request(app).post('/organizers')).send({ name: 'Ana' });
    await comToken(request(app).post('/organizers'), 'token-b').send({ name: 'Bruno' });

    const res = await comToken(request(app).get('/organizers/me'), 'token-b');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'uid-b', name: 'Bruno', email: 'b@teste.com' });
  });

  it('retorna 404 se ainda não criou o perfil', async () => {
    const res = await comToken(request(criarApp()).get('/organizers/me'));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Organizador não encontrado' });
  });
});
