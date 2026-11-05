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

const evento = {
  title: 'Casamento',
  date: '2026-12-01',
  location: 'Rio de Janeiro',
  description: 'Venha celebrar com a gente',
};
const comToken = (req, token = 'token-a') => req.set('Authorization', `Bearer ${token}`);

async function criarApp() {
  const eventRepository = new InMemoryEventRepository();
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository, verifyToken }),
  });
  await comToken(request(app).post('/events')).send(evento);
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  return { app, slug: convite.body.slug };
}

describe('GET /invites/:slug (pública)', () => {
  it('devolve os dados do evento sem precisar de login', async () => {
    const { app, slug } = await criarApp();

    const res = await request(app).get(`/invites/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      slug,
      title: 'Casamento',
      date: '2026-12-01',
      location: 'Rio de Janeiro',
      description: 'Venha celebrar com a gente',
      layout: 'basico',
    });
  });

  it('não expõe dados internos do evento', async () => {
    const { app, slug } = await criarApp();

    const res = await request(app).get(`/invites/${slug}`);

    for (const campo of ['id', 'organizerId', 'createdAt', 'pixKey', 'pixEnabled', 'whatsapp']) {
      expect(res.body).not.toHaveProperty(campo);
    }
  });

  it('manda Cache-Control: no-store', async () => {
    const { app, slug } = await criarApp();

    const res = await request(app).get(`/invites/${slug}`);

    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('retorna 404 para slug inexistente e para formato inválido', async () => {
    const { app } = await criarApp();

    const inexistente = await request(app).get('/invites/AAAAAAAAAAAA');
    const curto = await request(app).get('/invites/abc');
    const estranho = await request(app).get('/invites/..%2Fevents');

    expect(inexistente.status).toBe(404);
    expect(inexistente.body).toEqual({ error: 'Convite não encontrado' });
    expect(curto.status).toBe(404);
    expect(estranho.status).toBe(404);
  });

  it('o link antigo deixa de funcionar depois de regenerar', async () => {
    const { app, slug } = await criarApp();

    const novo = await comToken(request(app).post('/events/evento-1/invite/regenerate'));
    const antigo = await request(app).get(`/invites/${slug}`);
    const atual = await request(app).get(`/invites/${novo.body.slug}`);

    expect(antigo.status).toBe(404);
    expect(atual.status).toBe(200);
  });

  it('o link deixa de funcionar depois de desativar o convite', async () => {
    const { app, slug } = await criarApp();

    await comToken(request(app).delete('/events/evento-1/invite'));
    const res = await request(app).get(`/invites/${slug}`);

    expect(res.status).toBe(404);
  });

  it('o link deixa de funcionar depois que o evento é removido', async () => {
    const { app, slug } = await criarApp();

    await comToken(request(app).delete('/events/evento-1'));
    const res = await request(app).get(`/invites/${slug}`);

    expect(res.status).toBe(404);
  });

  it('reflete a edição do evento', async () => {
    const { app, slug } = await criarApp();

    await comToken(request(app).put('/events/evento-1')).send({ title: 'Casamento da Ana' });
    const res = await request(app).get(`/invites/${slug}`);

    expect(res.body.title).toBe('Casamento da Ana');
  });
});
