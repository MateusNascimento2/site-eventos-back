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
  const slug = convite.body.slug;
  const responder = (email, extra = {}) =>
    request(app)
      .post(`/invites/${slug}/rsvp`)
      .send({ name: 'Ana Souza', email, phone: '21987654321', confirmed: true, ...extra });

  await responder('ana@teste.com', { plusOne: true });
  await responder('bruno@teste.com', { name: 'Bruno' });
  const lista = await comToken(request(app).get('/events/evento-1/guests'));
  return { app, responder, ana: lista.body[0].id, bruno: lista.body[1].id };
}

const remover = (app, guestId, token = 'token-a', eventId = 'evento-1') =>
  comToken(request(app).delete(`/events/${eventId}/guests/${guestId}`), token);

describe('DELETE /events/:id/guests/:guestId', () => {
  it('exige autenticação', async () => {
    const { app, ana } = await criarApp();

    const res = await request(app).delete(`/events/evento-1/guests/${ana}`);

    expect(res.status).toBe(401);
  });

  it('remove só o convidado indicado e devolve 204 sem corpo', async () => {
    const { app, ana, bruno } = await criarApp();

    const res = await remover(app, ana);
    const lista = await comToken(request(app).get('/events/evento-1/guests'));

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(lista.body.map((g) => g.id)).toEqual([bruno]);
  });

  it('o resumo do evento deixa de contar o convidado e o acompanhante dele', async () => {
    const { app, ana } = await criarApp();

    await remover(app, ana);
    const resumo = await comToken(request(app).get('/events/evento-1/summary'));

    expect(resumo.body).toMatchObject({ total: 1, confirmed: 1, plusOnes: 0, attending: 1 });
  });

  it('o mesmo e-mail pode confirmar presença de novo depois da remoção', async () => {
    const { app, responder, ana } = await criarApp();

    const antes = await responder('ana@teste.com');
    await remover(app, ana);
    const depois = await responder('ana@teste.com');

    expect(antes.status).toBe(409);
    expect(depois.status).toBe(201);
  });

  it('remover de novo devolve 404', async () => {
    const { app, ana } = await criarApp();

    await remover(app, ana);
    const repetido = await remover(app, ana);

    expect(repetido.status).toBe(404);
    expect(repetido.body).toEqual({ error: 'Convidado não encontrado' });
  });

  it('retorna 404 para convidado inexistente ou com id de formato inválido', async () => {
    const { app } = await criarApp();

    const inexistente = await remover(app, 'nao-existe');
    const invalido = await remover(app, 'a.b');

    expect(inexistente.status).toBe(404);
    expect(invalido.status).toBe(404);
  });

  it('retorna 404 para evento de outro organizador ou inexistente, sem remover nada', async () => {
    const { app, ana } = await criarApp();

    const alheio = await remover(app, ana, 'token-b');
    const semEvento = await remover(app, ana, 'token-a', 'nao-existe');
    const lista = await comToken(request(app).get('/events/evento-1/guests'));

    expect(alheio.status).toBe(404);
    expect(alheio.body).toEqual({ error: 'Evento não encontrado' });
    expect(semEvento.status).toBe(404);
    expect(lista.body).toHaveLength(2);
  });
});
