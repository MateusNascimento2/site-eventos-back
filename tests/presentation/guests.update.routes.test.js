const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');

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
      guestRepository: new InMemoryGuestRepository(),
      verifyToken,
    }),
  });
  await comToken(request(app).post('/events')).send(evento);
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  await request(app).post(`/invites/${convite.body.slug}/rsvp`).send({
    name: 'Ana Souza',
    email: 'ana@teste.com',
    phone: '21987654321',
    confirmed: true,
    plusOne: true,
  });
  const lista = await comToken(request(app).get('/events/evento-1/guests'));
  return { app, guestId: lista.body[0].id };
}

const editar = (app, guestId, corpo, token = 'token-a', eventId = 'evento-1') =>
  comToken(request(app).put(`/events/${eventId}/guests/${guestId}`), token).send(corpo);

describe('PUT /events/:id/guests/:guestId', () => {
  it('exige autenticação', async () => {
    const { app, guestId } = await criarApp();

    const res = await request(app).put(`/events/evento-1/guests/${guestId}`).send({ name: 'X' });

    expect(res.status).toBe(401);
  });

  it('edita o nome e o telefone e mantém o resto, sem cache', async () => {
    const { app, guestId } = await criarApp();

    const res = await editar(app, guestId, { name: '  Ana Maria  ', phone: '(21) 91234-5678' });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({
      id: guestId,
      name: 'Ana Maria',
      email: 'ana@teste.com',
      phone: '21912345678',
      confirmed: true,
      plusOne: true,
    });
  });

  it('a alteração aparece na lista e no resumo do evento', async () => {
    const { app, guestId } = await criarApp();

    await editar(app, guestId, { plusOne: false });
    const lista = await comToken(request(app).get('/events/evento-1/guests'));
    const resumo = await comToken(request(app).get('/events/evento-1/summary'));

    expect(lista.body[0].plusOne).toBe(false);
    expect(resumo.body).toMatchObject({ confirmed: 1, plusOnes: 0, attending: 1 });
  });

  it('ao mudar para recusa, tira o acompanhante junto', async () => {
    const { app, guestId } = await criarApp();

    const res = await editar(app, guestId, { confirmed: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ confirmed: false, plusOne: false });
  });

  it('não aceita recusa com acompanhante', async () => {
    const { app, guestId } = await criarApp();

    const res = await editar(app, guestId, { confirmed: false, plusOne: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'plusOne só vale para convidado confirmado' });
  });

  it('não muda o e-mail nem outros campos do convidado', async () => {
    const { app, guestId } = await criarApp();

    const res = await editar(app, guestId, {
      name: 'Ana Maria',
      email: 'outro@teste.com',
      id: 'x',
      createdAt: '2000-01-01T00:00:00.000Z',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: guestId, email: 'ana@teste.com' });
    expect(res.body.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('retorna 400 para dados inválidos e sem nenhum campo editável', async () => {
    const { app, guestId } = await criarApp();
    const casos = [
      { name: '' },
      { name: 'a'.repeat(121) },
      { phone: '12345' },
      { confirmed: 'sim' },
      { plusOne: 'sim' },
      { email: 'outro@teste.com' },
      {},
    ];

    for (const corpo of casos) {
      expect((await editar(app, guestId, corpo)).status).toBe(400);
    }
    const semCorpo = await comToken(request(app).put(`/events/evento-1/guests/${guestId}`));
    expect(semCorpo.status).toBe(400);
  });

  it('retorna 404 para convidado inexistente ou com id de formato inválido', async () => {
    const { app } = await criarApp();

    const inexistente = await editar(app, 'nao-existe', { name: 'X' });
    const invalido = await editar(app, 'a.b', { name: 'X' });

    expect(inexistente.status).toBe(404);
    expect(inexistente.body).toEqual({ error: 'Convidado não encontrado' });
    expect(invalido.status).toBe(404);
  });

  it('retorna 404 para evento de outro organizador ou inexistente, sem alterar nada', async () => {
    const { app, guestId } = await criarApp();

    const alheio = await editar(app, guestId, { name: 'Invasor' }, 'token-b');
    const semEvento = await editar(app, guestId, { name: 'X' }, 'token-a', 'nao-existe');
    const lista = await comToken(request(app).get('/events/evento-1/guests'));

    expect(alheio.status).toBe(404);
    expect(alheio.body).toEqual({ error: 'Evento não encontrado' });
    expect(semEvento.status).toBe(404);
    expect(lista.body[0].name).toBe('Ana Souza');
  });
});
