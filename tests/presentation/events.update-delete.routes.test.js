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

async function appComEvento() {
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository: new InMemoryEventRepository(), verifyToken }),
  });
  await comToken(request(app).post('/events')).send(evento);
  return app;
}

describe('PUT /events/:id', () => {
  it('exige autenticação', async () => {
    const app = await appComEvento();

    const res = await request(app).put('/events/evento-1').send({ title: 'Novo' });

    expect(res.status).toBe(401);
  });

  it('atualiza só os campos enviados', async () => {
    const app = await appComEvento();

    const res = await comToken(request(app).put('/events/evento-1')).send({
      title: 'Casamento da Ana',
      layout: 'elegante',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'evento-1',
      title: 'Casamento da Ana',
      layout: 'elegante',
      date: '2026-12-01',
      location: 'Rio de Janeiro',
    });
  });

  it('ignora organizerId, slug e pixKey enviados no corpo', async () => {
    const app = await appComEvento();

    const res = await comToken(request(app).put('/events/evento-1')).send({
      title: 'Novo título',
      organizerId: 'uid-hacker',
      slug: 'meu-slug',
      pixKey: 'x',
    });

    expect(res.status).toBe(200);
    expect(res.body.organizerId).toBe('uid-a');
    expect(res.body.slug).toBeNull();
    expect(res.body.pixKey).toBeNull();
  });

  it('retorna 400 para dados inválidos e para corpo sem campos editáveis', async () => {
    const app = await appComEvento();

    const dataRuim = await comToken(request(app).put('/events/evento-1')).send({ date: '01/12' });
    const vazio = await comToken(request(app).put('/events/evento-1')).send({});
    const soExtras = await comToken(request(app).put('/events/evento-1')).send({ slug: 'x' });

    expect(dataRuim.status).toBe(400);
    expect(vazio.status).toBe(400);
    expect(vazio.body).toEqual({ error: 'Informe ao menos um campo para atualizar' });
    expect(soExtras.status).toBe(400);
  });

  it('retorna 404 para evento de outro organizador e para inexistente', async () => {
    const app = await appComEvento();

    const outro = await comToken(request(app).put('/events/evento-1'), 'token-b').send({
      title: 'Invadido',
    });
    const inexistente = await comToken(request(app).put('/events/nao-existe')).send({
      title: 'Novo',
    });
    const intacto = await comToken(request(app).get('/events/evento-1'));

    expect(outro.status).toBe(404);
    expect(inexistente.status).toBe(404);
    expect(intacto.body.title).toBe('Casamento');
  });
});

describe('DELETE /events/:id', () => {
  it('exige autenticação', async () => {
    const app = await appComEvento();

    const res = await request(app).delete('/events/evento-1');

    expect(res.status).toBe(401);
  });

  it('remove o evento do próprio organizador', async () => {
    const app = await appComEvento();

    const res = await comToken(request(app).delete('/events/evento-1'));
    const depois = await comToken(request(app).get('/events/evento-1'));

    expect(res.status).toBe(204);
    expect(depois.status).toBe(404);
  });

  it('retorna 404 para evento de outro organizador, sem apagar', async () => {
    const app = await appComEvento();

    const res = await comToken(request(app).delete('/events/evento-1'), 'token-b');
    const continua = await comToken(request(app).get('/events/evento-1'));

    expect(res.status).toBe(404);
    expect(continua.status).toBe(200);
  });

  it('retorna 404 para evento inexistente', async () => {
    const app = await appComEvento();

    const res = await comToken(request(app).delete('/events/nao-existe'));

    expect(res.status).toBe(404);
  });
});
