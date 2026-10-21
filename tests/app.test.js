const request = require('supertest');
const { createApp } = require('../src/main/app');

describe('API', () => {
  const app = createApp();

  it('GET / retorna o status da API', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'API no ar' });
  });

  it('retorna 404 para rota inexistente', async () => {
    const res = await request(app).get('/rota-que-nao-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Rota não encontrada' });
  });
});
