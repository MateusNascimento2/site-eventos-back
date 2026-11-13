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
const pix = { pixKey: 'casal@email.com', whatsapp: '(21) 98765-4321', pixEnabled: true };

async function criarApp() {
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({ eventRepository: new InMemoryEventRepository(), verifyToken }),
  });
  await comToken(request(app).post('/events')).send(evento);
  return app;
}

const salvarPix = (app, corpo, token = 'token-a') =>
  comToken(request(app).put('/events/evento-1/pix'), token).send(corpo);

describe('PUT /events/:id/pix', () => {
  it('exige autenticação', async () => {
    const app = await criarApp();

    const res = await request(app).put('/events/evento-1/pix').send(pix);

    expect(res.status).toBe(401);
  });

  it('salva a chave, o WhatsApp só com dígitos e habilita o Pix', async () => {
    const app = await criarApp();

    const res = await salvarPix(app, pix);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'evento-1',
      pixKey: 'casal@email.com',
      whatsapp: '21987654321',
      pixEnabled: true,
      title: 'Casamento',
    });
  });

  it('aceita alteração parcial e mantém o resto', async () => {
    const app = await criarApp();
    await salvarPix(app, pix);

    const desligado = await salvarPix(app, { pixEnabled: false });
    const novaChave = await salvarPix(app, { pixKey: 'outra-chave' });

    expect(desligado.body).toMatchObject({ pixEnabled: false, pixKey: 'casal@email.com' });
    expect(novaChave.body).toMatchObject({ pixKey: 'outra-chave', whatsapp: '21987654321' });
  });

  it('só habilita o Pix com chave e WhatsApp', async () => {
    const app = await criarApp();

    const semNada = await salvarPix(app, { pixEnabled: true });
    const semWhatsapp = await salvarPix(app, { pixEnabled: true, pixKey: 'chave' });

    expect(semNada.status).toBe(400);
    expect(semNada.body).toEqual({
      error: 'pixKey e whatsapp são obrigatórios para habilitar o Pix',
    });
    expect(semWhatsapp.status).toBe(400);
  });

  it('não deixa apagar a chave com o Pix habilitado, mas deixa junto com desabilitar', async () => {
    const app = await criarApp();
    await salvarPix(app, pix);

    const apagarSo = await salvarPix(app, { pixKey: '' });
    const apagarEDesligar = await salvarPix(app, { pixKey: '', pixEnabled: false });

    expect(apagarSo.status).toBe(400);
    expect(apagarEDesligar.status).toBe(200);
    expect(apagarEDesligar.body.pixKey).toBeNull();
  });

  it('retorna 400 para dados inválidos e sem nenhum campo', async () => {
    const app = await criarApp();

    const casos = [
      { whatsapp: '12345' },
      { pixKey: 'a'.repeat(141) },
      { pixEnabled: 'sim' },
      { title: 'outro', slug: 'x', organizerId: 'uid-b' },
      {},
    ];

    for (const corpo of casos) {
      expect((await salvarPix(app, corpo)).status).toBe(400);
    }
    const semCorpo = await comToken(request(app).put('/events/evento-1/pix'));
    expect(semCorpo.status).toBe(400);
  });

  it('não altera outros campos do evento', async () => {
    const app = await criarApp();

    await salvarPix(app, { ...pix, title: 'Hackeado', organizerId: 'uid-b', slug: 'x' });
    const res = await comToken(request(app).get('/events/evento-1'));

    expect(res.body).toMatchObject({ title: 'Casamento', organizerId: 'uid-a', slug: null });
  });

  it('retorna 404 para evento de outro organizador ou inexistente', async () => {
    const app = await criarApp();

    const alheio = await salvarPix(app, pix, 'token-b');
    const inexistente = await comToken(request(app).put('/events/nao-existe/pix')).send(pix);

    expect(alheio.status).toBe(404);
    expect(alheio.body).toEqual({ error: 'Evento não encontrado' });
    expect(inexistente.status).toBe(404);
  });
});
