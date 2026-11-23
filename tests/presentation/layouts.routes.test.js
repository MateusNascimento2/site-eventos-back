const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');

const verifyToken = async () => ({ uid: 'uid-a', email: 'a@teste.com' });
const comToken = (req) => req.set('Authorization', 'Bearer token-a');

function criarApp(publicLimits) {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository: new InMemoryEventRepository(), verifyToken }),
    ...(publicLimits ? { publicLimits } : {}),
  });
}

describe('GET /layouts', () => {
  it('lista os layouts sem exigir login, com cache público', async () => {
    const res = await request(criarApp()).get('/layouts');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=3600');
    expect(res.body[0]).toEqual({ id: 'basico', name: 'Básico' });
    expect(res.body.map((l) => l.id)).toEqual([
      'basico',
      'praia',
      'luz',
      'infantil',
      'corporativo',
    ]);
  });

  it('respeita o limite de requisições por IP', async () => {
    const app = criarApp({
      read: { max: 1, windowMs: 60000 },
      write: { max: 1, windowMs: 60000 },
    });

    const primeira = await request(app).get('/layouts');
    const segunda = await request(app).get('/layouts');

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(429);
  });

  it('o evento só aceita layout da lista, na criação e na edição', async () => {
    const app = criarApp();
    const corpo = { title: 'Festa', date: '2026-12-01', location: 'Rio' };

    const invalido = await comToken(request(app).post('/events')).send({
      ...corpo,
      layout: 'elegante',
    });
    const criado = await comToken(request(app).post('/events')).send({ ...corpo, layout: 'praia' });
    const editadoInvalido = await comToken(request(app).put(`/events/${criado.body.id}`)).send({
      layout: 'neon',
    });
    const editado = await comToken(request(app).put(`/events/${criado.body.id}`)).send({
      layout: 'luz',
    });

    expect(invalido.status).toBe(400);
    expect(invalido.body.error).toMatch(/^layout inválido, use um de: basico, praia/);
    expect(criado.status).toBe(201);
    expect(editadoInvalido.status).toBe(400);
    expect(editado.body.layout).toBe('luz');
  });

  it('o evento sem layout continua com o padrão', async () => {
    const app = criarApp();

    const res = await comToken(request(app).post('/events')).send({
      title: 'Festa',
      date: '2026-12-01',
      location: 'Rio',
    });

    expect(res.body.layout).toBe('basico');
  });
});
