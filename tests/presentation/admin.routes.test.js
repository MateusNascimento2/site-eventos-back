const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { Organizer } = require('../../src/domain/entities/Organizer');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');

const usuarios = {
  'token-admin': { uid: 'uid-admin', email: 'admin@teste.com', admin: true },
  'token-a': { uid: 'uid-a', email: 'a@teste.com', admin: false },
  'token-sem-flag': { uid: 'uid-b', email: 'b@teste.com' },
  'token-admin-texto': { uid: 'uid-c', email: 'c@teste.com', admin: 'true' },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('token ruim');
  return usuarios[token];
};

const comToken = (req, token = 'token-admin') => req.set('Authorization', `Bearer ${token}`);

async function criarApp() {
  const eventRepository = new InMemoryEventRepository();
  const organizerRepository = new InMemoryOrganizerRepository();
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository, organizerRepository, verifyToken }),
  });

  await organizerRepository.create(
    new Organizer({
      id: 'uid-a',
      name: 'Ana',
      email: 'a@teste.com',
      createdAt: '2026-11-01T10:00:00.000Z',
    }),
  );
  await organizerRepository.create(
    new Organizer({
      id: 'uid-b',
      name: 'Bia',
      email: 'b@teste.com',
      createdAt: '2026-11-02T10:00:00.000Z',
    }),
  );

  const criar = (token, corpo) => comToken(request(app).post('/events'), token).send(corpo);
  await criar('token-a', { title: 'Casamento', date: '2026-12-01', location: 'Rio' });
  await criar('token-sem-flag', { title: 'Festa', date: '2026-12-10', location: 'Niterói' });
  await comToken(request(app).post('/events/evento-1/invite'), 'token-a');
  await comToken(request(app).put('/events/evento-1/pix'), 'token-a').send({
    pixKey: 'casal@email.com',
    whatsapp: '21987654321',
    pixName: 'Ana',
    pixCity: 'Rio',
    pixEnabled: true,
  });

  return app;
}

describe('rotas /admin', () => {
  const rotas = ['/admin/organizers', '/admin/events', '/admin/summary'];

  it('exige autenticação', async () => {
    const app = await criarApp();

    for (const rota of rotas) {
      expect((await request(app).get(rota)).status).toBe(401);
    }
  });

  it('nega acesso a quem não é administrador', async () => {
    const app = await criarApp();

    for (const token of ['token-a', 'token-sem-flag', 'token-admin-texto']) {
      for (const rota of rotas) {
        const res = await comToken(request(app).get(rota), token);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Acesso restrito a administradores' });
      }
    }
  });

  it('lista todos os organizadores, do mais novo para o mais antigo', async () => {
    const app = await criarApp();

    const res = await comToken(request(app).get('/admin/organizers'));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.map((o) => o.id)).toEqual(['uid-b', 'uid-a']);
    expect(res.body[0]).toMatchObject({ name: 'Bia', email: 'b@teste.com' });
  });

  it('lista os eventos de todos sem expor Pix, WhatsApp ou descrição', async () => {
    const app = await criarApp();

    const res = await comToken(request(app).get('/admin/events'));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toHaveLength(2);
    const casamento = res.body.find((e) => e.id === 'evento-1');
    expect(casamento).toMatchObject({
      organizerId: 'uid-a',
      title: 'Casamento',
      pixEnabled: true,
    });
    expect(typeof casamento.slug).toBe('string');
    for (const evento of res.body) {
      expect(evento).not.toHaveProperty('pixKey');
      expect(evento).not.toHaveProperty('whatsapp');
      expect(evento).not.toHaveProperty('pixName');
      expect(evento).not.toHaveProperty('description');
    }
  });

  it('devolve o resumo geral', async () => {
    const app = await criarApp();

    const res = await comToken(request(app).get('/admin/summary'));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ organizers: 2, events: 2, activeInvites: 1, pixEnabled: 1 });
  });

  it('as rotas do organizador continuam sem exigir admin', async () => {
    const app = await criarApp();

    const res = await comToken(request(app).get('/events'), 'token-a');

    expect(res.status).toBe(200);
  });
});
