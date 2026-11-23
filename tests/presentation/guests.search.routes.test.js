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

const comToken = (req, token = 'token-a') => req.set('Authorization', `Bearer ${token}`);

const convidados = [
  ['Ana Souza', 'ana@teste.com', true],
  ['José Álvares', 'jose@teste.com', true],
  ['Bruno Lima', 'bruno@outro.com', false],
  ['Carla Dias', 'carla@teste.com', true],
  ['Anselmo Reis', 'anselmo@teste.com', false],
];

async function criarApp() {
  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository: new InMemoryGuestRepository(),
      verifyToken,
    }),
  });
  await comToken(request(app).post('/events')).send({
    title: 'Casamento',
    date: '2026-12-01',
    location: 'Rio de Janeiro',
  });
  const convite = await comToken(request(app).post('/events/evento-1/invite'));
  for (const [name, email, confirmed] of convidados) {
    await request(app)
      .post(`/invites/${convite.body.slug}/rsvp`)
      .send({ name, email, phone: '21987654321', confirmed });
  }
  return app;
}

const listar = (app, query = '', token = 'token-a') =>
  comToken(request(app).get(`/events/evento-1/guests${query}`), token);
const nomes = (res) => res.body.map((g) => g.name);

describe('GET /events/:id/guests com busca e paginação', () => {
  it('sem parâmetros devolve todos, com o total no header', async () => {
    const app = await criarApp();

    const res = await listar(app);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.headers['x-total-count']).toBe('5');
    expect(res.headers['x-page']).toBe('1');
    expect(res.headers['x-total-pages']).toBe('1');
  });

  it('busca por nome ou e-mail sem diferenciar maiúsculas e acentos', async () => {
    const app = await criarApp();

    expect(nomes(await listar(app, '?search=JOSE'))).toEqual(['José Álvares']);
    expect(nomes(await listar(app, '?search=%C3%A1lvares'))).toEqual(['José Álvares']);
    expect(nomes(await listar(app, '?search=outro.com'))).toEqual(['Bruno Lima']);
    expect(nomes(await listar(app, '?search=an'))).toEqual(['Ana Souza', 'Anselmo Reis']);
    expect(nomes(await listar(app, '?search=%20%20'))).toHaveLength(5);
    const nada = await listar(app, '?search=xyz');
    expect(nada.body).toEqual([]);
    expect(nada.headers['x-total-count']).toBe('0');
    expect(nada.headers['x-total-pages']).toBe('1');
  });

  it('combina busca com o filtro de confirmados', async () => {
    const app = await criarApp();

    const res = await listar(app, '?search=an&confirmed=false');

    expect(nomes(res)).toEqual(['Anselmo Reis']);
    expect(res.headers['x-total-count']).toBe('1');
  });

  it('pagina com limit e page e informa total e páginas', async () => {
    const app = await criarApp();

    const primeira = await listar(app, '?limit=2');
    const segunda = await listar(app, '?limit=2&page=2');
    const ultima = await listar(app, '?limit=2&page=3');
    const alem = await listar(app, '?limit=2&page=9');

    expect(primeira.body).toHaveLength(2);
    expect(segunda.body).toHaveLength(2);
    expect(ultima.body).toHaveLength(1);
    expect(alem.body).toEqual([]);
    expect(primeira.headers['x-total-count']).toBe('5');
    expect(primeira.headers['x-total-pages']).toBe('3');
    expect(segunda.headers['x-page']).toBe('2');
    const todos = [...primeira.body, ...segunda.body, ...ultima.body].map((g) => g.id);
    expect(new Set(todos).size).toBe(5);
  });

  it('o total e as páginas valem para o resultado filtrado', async () => {
    const app = await criarApp();

    const res = await listar(app, '?confirmed=true&limit=2');

    expect(res.body).toHaveLength(2);
    expect(res.headers['x-total-count']).toBe('3');
    expect(res.headers['x-total-pages']).toBe('2');
  });

  it('retorna 400 para parâmetros inválidos', async () => {
    const app = await criarApp();
    const invalidos = [
      '?limit=0',
      '?limit=101',
      '?limit=abc',
      '?limit=-1',
      '?limit=1.5',
      '?limit=2&page=0',
      '?limit=2&page=x',
      '?page=2',
      `?search=${'a'.repeat(101)}`,
      '?search=a&search=b',
    ];

    for (const query of invalidos) {
      expect((await listar(app, query)).status).toBe(400);
    }
  });

  it('mantém o acesso restrito ao dono do evento', async () => {
    const app = await criarApp();

    const semLogin = await request(app).get('/events/evento-1/guests?search=ana');
    const alheio = await listar(app, '?search=ana', 'token-b');

    expect(semLogin.status).toBe(401);
    expect(alheio.status).toBe(404);
  });

  it('libera os headers de paginação para o front via CORS', async () => {
    const app = await criarApp();

    const res = await comToken(request(app).get('/events/evento-1/guests')).set(
      'Origin',
      'http://localhost:5173',
    );

    expect(res.headers['access-control-expose-headers'] ?? '').toMatch(/X-Total-Count/i);
  });
});
