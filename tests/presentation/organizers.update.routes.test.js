const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');

const usuarios = {
  'token-a': { uid: 'uid-a', email: 'a@teste.com' },
  'token-b': { uid: 'uid-b', email: 'b@teste.com' },
  'token-sem-perfil': { uid: 'uid-c', email: 'c@teste.com' },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('token ruim');
  return usuarios[token];
};

const comToken = (req, token = 'token-a') => req.set('Authorization', `Bearer ${token}`);

async function criarApp() {
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      organizerRepository: new InMemoryOrganizerRepository(),
      verifyToken,
    }),
  });
  await comToken(request(app).post('/organizers')).send({ name: 'Ana Souza' });
  await comToken(request(app).post('/organizers'), 'token-b').send({ name: 'Bruno' });
  return app;
}

const editar = (app, corpo, token = 'token-a') =>
  comToken(request(app).put('/organizers/me'), token).send(corpo);

describe('PUT /organizers/me', () => {
  it('exige autenticação', async () => {
    const app = await criarApp();

    const res = await request(app).put('/organizers/me').send({ name: 'Ana' });

    expect(res.status).toBe(401);
  });

  it('muda o nome, tira os espaços das pontas e mantém o resto', async () => {
    const app = await criarApp();
    const antes = await comToken(request(app).get('/organizers/me'));

    const res = await editar(app, { name: '  Ana Maria Souza  ' });
    const depois = await comToken(request(app).get('/organizers/me'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...antes.body, name: 'Ana Maria Souza' });
    expect(depois.body.name).toBe('Ana Maria Souza');
  });

  it('ignora e-mail, bloqueio, id e data enviados no corpo', async () => {
    const app = await criarApp();
    const antes = await comToken(request(app).get('/organizers/me'));

    const res = await editar(app, {
      name: 'Ana Maria',
      email: 'outro@teste.com',
      disabled: true,
      id: 'uid-b',
      createdAt: '2000-01-01T00:00:00.000Z',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...antes.body, name: 'Ana Maria' });
  });

  it('não altera o perfil de outro organizador', async () => {
    const app = await criarApp();

    await editar(app, { name: 'Ana Maria' });
    const outro = await comToken(request(app).get('/organizers/me'), 'token-b');

    expect(outro.body.name).toBe('Bruno');
  });

  it('retorna 400 para nome inválido e para corpo sem campo editável', async () => {
    const app = await criarApp();
    const casos = [{ name: '' }, { name: '   ' }, { name: 123 }, { name: 'a'.repeat(121) }, {}];

    for (const corpo of casos) {
      expect((await editar(app, corpo)).status).toBe(400);
    }
    const semCorpo = await comToken(request(app).put('/organizers/me'));
    expect(semCorpo.status).toBe(400);
    expect(semCorpo.body).toEqual({ error: 'Informe ao menos um campo para atualizar' });
    const semAlteracao = await editar(app, { email: 'outro@teste.com' });
    expect(semAlteracao.status).toBe(400);
  });

  it('retorna 404 quando o usuário ainda não criou o perfil', async () => {
    const app = await criarApp();

    const res = await editar(app, { name: 'Carla' }, 'token-sem-perfil');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Organizador não encontrado' });
  });
});
