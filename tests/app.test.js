const request = require('supertest');
const { createApp } = require('../src/main/app');

describe('API', () => {
  const app = createApp({ checkDatabase: async () => {} });

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

describe('GET /health/firebase', () => {
  it('retorna 200 quando a conexão com o Firebase funciona', async () => {
    const app = createApp({ checkDatabase: async () => {} });
    const res = await request(app).get('/health/firebase');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', firebase: 'conectado' });
  });

  it('retorna 503 sem vazar detalhes quando a conexão falha', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp({
      checkDatabase: async () => {
        throw new Error('detalhe interno secreto');
      },
    });
    const res = await request(app).get('/health/firebase');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'erro', firebase: 'falha na conexão' });
    expect(JSON.stringify(res.body)).not.toContain('secreto');

    consoleSpy.mockRestore();
  });
});
