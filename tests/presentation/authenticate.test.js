const express = require('express');
const request = require('supertest');
const { createAuthenticate } = require('../../src/presentation/http/middlewares/authenticate');
const { errorHandler } = require('../../src/presentation/http/middlewares/errorHandler');

function criarApp(verifyToken) {
  const app = express();
  app.get('/protegida', createAuthenticate({ verifyToken }), (req, res) => {
    res.json({ uid: req.user.uid });
  });
  app.use(errorHandler);
  return app;
}

describe('middleware authenticate', () => {
  const verifyToken = async (token) => {
    if (token !== 'token-bom') throw new Error('token ruim');
    return { uid: 'uid-1', email: 'a@b.com' };
  };

  it('libera com token válido e preenche req.user', async () => {
    const res = await request(criarApp(verifyToken))
      .get('/protegida')
      .set('Authorization', 'Bearer token-bom');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ uid: 'uid-1' });
  });

  it('retorna 401 sem o cabeçalho Authorization', async () => {
    const res = await request(criarApp(verifyToken)).get('/protegida');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token não informado' });
  });

  it('retorna 401 quando o esquema não é Bearer', async () => {
    const res = await request(criarApp(verifyToken))
      .get('/protegida')
      .set('Authorization', 'Basic token-bom');

    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido, sem vazar o motivo', async () => {
    const res = await request(criarApp(verifyToken))
      .get('/protegida')
      .set('Authorization', 'Bearer token-ruim');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token inválido' });
  });
});
