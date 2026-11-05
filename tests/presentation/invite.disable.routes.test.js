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

async function criarApp() {
  const eventRepository = new InMemoryEventRepository();
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository, verifyToken }),
  });
  await comToken(request(app).post('/events')).send(evento);
  return { app, eventRepository };
}

describe('DELETE /events/:id/invite', () => {
  it('exige autenticação', async () => {
    const { app } = await criarApp();

    const res = await request(app).delete('/events/evento-1/invite');

    expect(res.status).toBe(401);
  });

  it('desativa o convite e devolve 204', async () => {
    const { app, eventRepository } = await criarApp();
    await comToken(request(app).post('/events/evento-1/invite'));

    const res = await comToken(request(app).delete('/events/evento-1/invite'));

    expect(res.status).toBe(204);
    expect((await eventRepository.findById('evento-1')).slug).toBeNull();
  });

  it('é idempotente: desativar de novo ou sem convite também devolve 204', async () => {
    const { app } = await criarApp();

    const semConvite = await comToken(request(app).delete('/events/evento-1/invite'));
    await comToken(request(app).post('/events/evento-1/invite'));
    await comToken(request(app).delete('/events/evento-1/invite'));
    const repetido = await comToken(request(app).delete('/events/evento-1/invite'));

    expect(semConvite.status).toBe(204);
    expect(repetido.status).toBe(204);
  });

  it('permite gerar um convite novo depois de desativar', async () => {
    const { app } = await criarApp();
    const primeiro = await comToken(request(app).post('/events/evento-1/invite'));
    await comToken(request(app).delete('/events/evento-1/invite'));

    const segundo = await comToken(request(app).post('/events/evento-1/invite'));

    expect(segundo.status).toBe(201);
    expect(segundo.body.slug).not.toBe(primeiro.body.slug);
  });

  it('retorna 404 para evento de outro organizador, sem desativar', async () => {
    const { app, eventRepository } = await criarApp();
    const convite = await comToken(request(app).post('/events/evento-1/invite'));

    const res = await comToken(request(app).delete('/events/evento-1/invite'), 'token-b');

    expect(res.status).toBe(404);
    expect((await eventRepository.findById('evento-1')).slug).toBe(convite.body.slug);
  });

  it('retorna 404 para evento inexistente', async () => {
    const { app } = await criarApp();

    const res = await comToken(request(app).delete('/events/nao-existe/invite'));

    expect(res.status).toBe(404);
  });
});
