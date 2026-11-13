const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGiftRepository } = require('../helpers/InMemoryGiftRepository');

const verifyToken = async (token) => {
  if (token !== 'token-a') throw new Error('token ruim');
  return { uid: 'uid-a', email: 'a@teste.com' };
};

const evento = { title: 'Casamento', date: '2026-12-01', location: 'Rio de Janeiro' };
const comToken = (req) => req.set('Authorization', 'Bearer token-a');

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
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  return { app, slug: convite.body.slug };
}

const habilitarPix = (app) =>
  comToken(request(app).put('/events/evento-1/pix')).send({
    pixKey: 'casal@email.com',
    whatsapp: '21987654321',
    pixEnabled: true,
  });

describe('GET /invites/:slug/gifts (pública)', () => {
  it('devolve lista vazia e sem Pix quando o organizador não configurou nada', async () => {
    const { app, slug } = await criarApp();

    const res = await request(app).get(`/invites/${slug}/gifts`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ gifts: [], pix: null });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('lista os presentes sem dados internos', async () => {
    const { app, slug } = await criarApp();
    await comToken(request(app).post('/events/evento-1/gifts')).send({
      name: 'Jogo de panelas',
      description: 'Inox',
    });

    const res = await request(app).get(`/invites/${slug}/gifts`);

    expect(res.body.gifts).toEqual([
      { id: expect.any(String), name: 'Jogo de panelas', description: 'Inox' },
    ]);
  });

  it('mostra a chave Pix e o WhatsApp só quando o Pix está habilitado', async () => {
    const { app, slug } = await criarApp();
    await habilitarPix(app);

    const ligado = await request(app).get(`/invites/${slug}/gifts`);
    await comToken(request(app).put('/events/evento-1/pix')).send({ pixEnabled: false });
    const desligado = await request(app).get(`/invites/${slug}/gifts`);

    expect(ligado.body.pix).toEqual({ key: 'casal@email.com', whatsapp: '21987654321' });
    expect(desligado.body.pix).toBeNull();
    expect(JSON.stringify(desligado.body)).not.toContain('casal@email.com');
  });

  it('não expõe dados do organizador nem do evento', async () => {
    const { app, slug } = await criarApp();
    await habilitarPix(app);

    const res = await request(app).get(`/invites/${slug}/gifts`);

    expect(Object.keys(res.body).sort()).toEqual(['gifts', 'pix']);
    expect(JSON.stringify(res.body)).not.toContain('uid-a');
  });

  it('retorna 404 para slug inexistente, inválido, trocado ou desativado', async () => {
    const { app, slug } = await criarApp();
    const novo = await comToken(request(app).post('/events/evento-1/invite/regenerate'));

    const inexistente = await request(app).get('/invites/AAAAAAAAAAAA/gifts');
    const invalido = await request(app).get('/invites/abc/gifts');
    const antigo = await request(app).get(`/invites/${slug}/gifts`);
    await comToken(request(app).delete('/events/evento-1/invite'));
    const desativado = await request(app).get(`/invites/${novo.body.slug}/gifts`);

    for (const res of [inexistente, invalido, antigo, desativado]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Convite não encontrado' });
    }
  });
});
