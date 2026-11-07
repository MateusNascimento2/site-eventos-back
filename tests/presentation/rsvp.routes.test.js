const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');

const verifyToken = async (token) => {
  if (token !== 'token-a') throw new Error('token ruim');
  return { uid: 'uid-a', email: 'a@teste.com' };
};

const evento = { title: 'Casamento', date: '2026-12-01', location: 'Rio de Janeiro' };
const comToken = (req) => req.set('Authorization', 'Bearer token-a');

async function criarApp() {
  const guestRepository = new InMemoryGuestRepository();
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository,
      verifyToken,
    }),
  });
  await comToken(request(app).post('/events')).send(evento);
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  return { app, guestRepository, slug: convite.body.slug };
}

const contato = { email: 'ana@teste.com', phone: '(21) 98765-4321' };
const confirmar = (app, slug, corpo) => request(app).post(`/invites/${slug}/rsvp`).send(corpo);

describe('POST /invites/:slug/rsvp (pública)', () => {
  it('confirma presença sem login e devolve 201', async () => {
    const { app, slug } = await criarApp();

    const res = await confirmar(app, slug, {
      name: 'Ana Souza',
      ...contato,
      confirmed: true,
      plusOne: true,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ name: 'Ana Souza', confirmed: true, plusOne: true });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('grava o convidado no evento do convite, com o nome sem espaços extras', async () => {
    const { app, guestRepository, slug } = await criarApp();

    await confirmar(app, slug, { name: '  Ana Souza  ', ...contato, confirmed: true });
    const guardados = await guestRepository.listByEvent('evento-1');

    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@teste.com',
      phone: '21987654321',
      confirmed: true,
      plusOne: false,
    });
  });

  it('registra quem não vai (confirmed false)', async () => {
    const { app, slug } = await criarApp();

    const res = await confirmar(app, slug, { name: 'Bruno Lima', ...contato, confirmed: false });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ name: 'Bruno Lima', confirmed: false, plusOne: false });
  });

  it('ignora id e createdAt enviados no corpo', async () => {
    const { app, guestRepository, slug } = await criarApp();

    await confirmar(app, slug, {
      name: 'Carla Dias',
      ...contato,
      confirmed: true,
      id: 'outro-id',
      createdAt: '2000-01-01T00:00:00.000Z',
    });
    const [guardado] = await guestRepository.listByEvent('evento-1');

    expect(guardado.id).not.toBe('outro-id');
    expect(guardado.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('retorna 400 para dados inválidos', async () => {
    const { app, slug } = await criarApp();
    const base = { name: 'Ana', ...contato, confirmed: true };

    const casos = [
      { ...base, name: undefined },
      { ...base, name: 'a'.repeat(121) },
      { ...base, confirmed: undefined },
      { ...base, confirmed: 'sim' },
      { ...base, confirmed: false, plusOne: true },
      { ...base, email: undefined },
      { ...base, email: 'sem-arroba' },
      { ...base, phone: undefined },
      { ...base, phone: '12345' },
    ];

    for (const corpo of casos) {
      const res = await confirmar(app, slug, corpo);
      expect(res.status).toBe(400);
    }
    const semCorpo = await request(app).post(`/invites/${slug}/rsvp`);
    expect(semCorpo.status).toBe(400);

    const semEmail = await confirmar(app, slug, { ...base, email: undefined });
    const semTelefone = await confirmar(app, slug, { ...base, phone: undefined });
    expect(semEmail.body).toEqual({ error: 'email é obrigatório' });
    expect(semTelefone.body).toEqual({ error: 'phone é obrigatório' });
  });

  it('não devolve e-mail nem telefone na resposta', async () => {
    const { app, slug } = await criarApp();

    const res = await confirmar(app, slug, { name: 'Ana', ...contato, confirmed: true });

    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('phone');
  });

  it('retorna 409 para o mesmo e-mail, mesmo com outra grafia', async () => {
    const { app, guestRepository, slug } = await criarApp();
    await confirmar(app, slug, { name: 'José da Silva', ...contato, confirmed: true });

    const repetido = await confirmar(app, slug, {
      name: 'Outro Nome',
      email: '  ANA@Teste.com ',
      phone: '21999998888',
      confirmed: false,
    });

    expect(repetido.status).toBe(409);
    expect(repetido.body).toEqual({ error: 'Esse e-mail já confirmou presença' });
    expect(await guestRepository.listByEvent('evento-1')).toHaveLength(1);
  });

  it('aceita o mesmo nome com e-mails diferentes', async () => {
    const { app, guestRepository, slug } = await criarApp();
    await confirmar(app, slug, { name: 'Ana Souza', ...contato, confirmed: true });

    const res = await confirmar(app, slug, {
      name: 'Ana Souza',
      email: 'ana.outra@teste.com',
      phone: '21977776666',
      confirmed: true,
    });

    expect(res.status).toBe(201);
    expect(await guestRepository.listByEvent('evento-1')).toHaveLength(2);
  });

  it('aceita o mesmo nome em eventos diferentes', async () => {
    const { app, slug } = await criarApp();
    await comToken(request(app).post('/events')).send(evento);
    const outro = await comToken(request(app).post('/events/evento-2/invite'));
    await confirmar(app, slug, { name: 'Ana Souza', ...contato, confirmed: true });

    const res = await confirmar(app, outro.body.slug, {
      name: 'Ana Souza',
      ...contato,
      confirmed: true,
    });

    expect(res.status).toBe(201);
  });

  it('retorna 404 para slug inexistente, inválido, trocado ou desativado', async () => {
    const { app, slug } = await criarApp();
    const corpo = { name: 'Ana Souza', ...contato, confirmed: true };

    const inexistente = await confirmar(app, 'AAAAAAAAAAAA', corpo);
    const invalido = await confirmar(app, 'abc', corpo);
    const novo = await comToken(request(app).post('/events/evento-1/invite/regenerate'));
    const antigo = await confirmar(app, slug, corpo);
    await comToken(request(app).delete('/events/evento-1/invite'));
    const desativado = await confirmar(app, novo.body.slug, corpo);

    for (const res of [inexistente, invalido, antigo, desativado]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Convite não encontrado' });
    }
  });

  it('não grava nada quando o convite não existe', async () => {
    const { app, guestRepository } = await criarApp();

    await confirmar(app, 'AAAAAAAAAAAA', { name: 'Ana Souza', ...contato, confirmed: true });

    expect(await guestRepository.listByEvent('evento-1')).toEqual([]);
  });
});
