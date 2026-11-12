const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { MAXIMO_POR_EVENTO } = require('../../src/application/use-cases/CreateGift');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGiftRepository } = require('../helpers/InMemoryGiftRepository');

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
      giftRepository: new InMemoryGiftRepository(),
      verifyToken,
    }),
  });
  await comToken(request(app).post('/events')).send(evento);
  return app;
}

const criarPresente = (app, corpo = { name: 'Jogo de panelas' }, token = 'token-a') =>
  comToken(request(app).post('/events/evento-1/gifts'), token).send(corpo);

describe('POST /events/:id/gifts', () => {
  it('exige autenticação', async () => {
    const app = await criarApp();

    const res = await request(app).post('/events/evento-1/gifts').send({ name: 'Panela' });

    expect(res.status).toBe(401);
  });

  it('cria o presente e devolve 201 com id e data de criação', async () => {
    const app = await criarApp();

    const res = await criarPresente(app, { name: ' Jogo de panelas ', description: 'Inox' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Jogo de panelas', description: 'Inox' });
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.createdAt).toEqual(expect.any(String));
  });

  it('ignora id e createdAt enviados no corpo', async () => {
    const app = await criarApp();

    const res = await criarPresente(app, {
      name: 'Panela',
      id: 'outro-id',
      createdAt: '2000-01-01T00:00:00.000Z',
    });

    expect(res.body.id).not.toBe('outro-id');
    expect(res.body.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('retorna 400 para dados inválidos e para corpo vazio', async () => {
    const app = await criarApp();

    const semNome = await criarPresente(app, { description: 'x' });
    const nomeLongo = await criarPresente(app, { name: 'a'.repeat(121) });
    const descricaoLonga = await criarPresente(app, {
      name: 'Panela',
      description: 'a'.repeat(301),
    });
    const semCorpo = await comToken(request(app).post('/events/evento-1/gifts'));

    for (const res of [semNome, nomeLongo, descricaoLonga, semCorpo]) {
      expect(res.status).toBe(400);
    }
    expect(semNome.body).toEqual({ error: 'name é obrigatório' });
  });

  it('limita a quantidade de presentes por evento', async () => {
    const app = await criarApp();
    for (let i = 0; i < MAXIMO_POR_EVENTO; i++) {
      await criarPresente(app, { name: `Presente ${i}` });
    }

    const res = await criarPresente(app, { name: 'Um a mais' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: `O evento já tem o máximo de ${MAXIMO_POR_EVENTO} presentes`,
    });
  });

  it('retorna 404 para evento de outro organizador', async () => {
    const app = await criarApp();

    const res = await criarPresente(app, { name: 'Panela' }, 'token-b');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Evento não encontrado' });
  });
});

describe('GET /events/:id/gifts', () => {
  it('exige autenticação', async () => {
    const app = await criarApp();

    expect((await request(app).get('/events/evento-1/gifts')).status).toBe(401);
  });

  it('devolve lista vazia e depois os presentes criados', async () => {
    const app = await criarApp();
    const vazia = await comToken(request(app).get('/events/evento-1/gifts'));
    await criarPresente(app, { name: 'Panela' });
    await criarPresente(app, { name: 'Jogo de toalhas' });

    const res = await comToken(request(app).get('/events/evento-1/gifts'));

    expect(vazia.body).toEqual([]);
    expect(res.status).toBe(200);
    expect(res.body.map((g) => g.name)).toEqual(['Panela', 'Jogo de toalhas']);
  });

  it('retorna 404 para evento de outro organizador ou inexistente', async () => {
    const app = await criarApp();

    const alheio = await comToken(request(app).get('/events/evento-1/gifts'), 'token-b');
    const inexistente = await comToken(request(app).get('/events/nao-existe/gifts'));

    expect(alheio.status).toBe(404);
    expect(inexistente.status).toBe(404);
  });
});

describe('PUT /events/:id/gifts/:giftId', () => {
  it('edita o presente e mantém os campos que não vieram', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app, { name: 'Panela', description: 'Inox' });

    const res = await comToken(request(app).put(`/events/evento-1/gifts/${criado.body.id}`)).send({
      name: 'Panela de pressão',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: criado.body.id,
      name: 'Panela de pressão',
      description: 'Inox',
    });
  });

  it('retorna 400 sem nenhum campo editável ou com dado inválido', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app);
    const url = `/events/evento-1/gifts/${criado.body.id}`;

    const vazio = await comToken(request(app).put(url)).send({ id: 'x' });
    const invalido = await comToken(request(app).put(url)).send({ name: '' });

    expect(vazio.status).toBe(400);
    expect(vazio.body).toEqual({ error: 'Informe ao menos um campo para atualizar' });
    expect(invalido.status).toBe(400);
  });

  it('retorna 404 para presente inexistente, de outro evento ou com id inválido', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app);

    const inexistente = await comToken(request(app).put('/events/evento-1/gifts/nao-existe')).send({
      name: 'X',
    });
    const invalido = await comToken(request(app).put('/events/evento-1/gifts/..%2Fx')).send({
      name: 'X',
    });
    const alheio = await comToken(
      request(app).put(`/events/evento-1/gifts/${criado.body.id}`),
      'token-b',
    ).send({ name: 'X' });

    expect(inexistente.status).toBe(404);
    expect(inexistente.body).toEqual({ error: 'Presente não encontrado' });
    expect(invalido.status).toBe(404);
    expect(alheio.status).toBe(404);
    expect(alheio.body).toEqual({ error: 'Evento não encontrado' });
  });

  it('exige autenticação', async () => {
    const app = await criarApp();

    const res = await request(app).put('/events/evento-1/gifts/qualquer').send({ name: 'X' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /events/:id/gifts/:giftId', () => {
  it('remove o presente e devolve 204', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app);

    const res = await comToken(request(app).delete(`/events/evento-1/gifts/${criado.body.id}`));
    const lista = await comToken(request(app).get('/events/evento-1/gifts'));

    expect(res.status).toBe(204);
    expect(lista.body).toEqual([]);
  });

  it('retorna 404 quando o presente já foi removido ou não existe', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app);
    const url = `/events/evento-1/gifts/${criado.body.id}`;
    await comToken(request(app).delete(url));

    const repetido = await comToken(request(app).delete(url));

    expect(repetido.status).toBe(404);
    expect(repetido.body).toEqual({ error: 'Presente não encontrado' });
  });

  it('não deixa outro organizador remover o presente', async () => {
    const app = await criarApp();
    const criado = await criarPresente(app);

    const res = await comToken(
      request(app).delete(`/events/evento-1/gifts/${criado.body.id}`),
      'token-b',
    );
    const lista = await comToken(request(app).get('/events/evento-1/gifts'));

    expect(res.status).toBe(404);
    expect(lista.body).toHaveLength(1);
  });

  it('exige autenticação', async () => {
    const app = await criarApp();

    expect((await request(app).delete('/events/evento-1/gifts/qualquer')).status).toBe(401);
  });
});
