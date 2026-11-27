const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { spec } = require('../../src/presentation/http/openapi/openapiDocument');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryGuestRepository } = require('../helpers/InMemoryGuestRepository');
const { InMemoryGiftRepository } = require('../helpers/InMemoryGiftRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');
const { InMemoryAuditLogRepository } = require('../helpers/InMemoryAuditLogRepository');

const METODOS = ['get', 'post', 'put', 'delete'];

function criarApp() {
  return createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository: new InMemoryEventRepository(),
      guestRepository: new InMemoryGuestRepository(),
      giftRepository: new InMemoryGiftRepository(),
      organizerRepository: new InMemoryOrganizerRepository(),
      auditLogRepository: new InMemoryAuditLogRepository(),
      verifyToken: async () => ({ uid: 'uid-admin', email: 'admin@teste.com', admin: true }),
    }),
  });
}

const operacoes = Object.entries(spec.paths).flatMap(([caminho, itens]) =>
  METODOS.filter((metodo) => itens[metodo]).map((metodo) => ({
    caminho,
    metodo,
    operacao: itens[metodo],
  })),
);

function referencias(valor, achadas = []) {
  if (Array.isArray(valor)) valor.forEach((item) => referencias(item, achadas));
  else if (valor && typeof valor === 'object') {
    for (const [chave, item] of Object.entries(valor)) {
      if (chave === '$ref') achadas.push(item);
      else referencias(item, achadas);
    }
  }
  return achadas;
}

function resolver(caminhoRef) {
  return caminhoRef
    .replace('#/', '')
    .split('/')
    .reduce((atual, parte) => atual?.[parte], spec);
}

describe('GET /docs', () => {
  it('serve a página do Swagger UI sem exigir login', async () => {
    const res = await request(criarApp()).get('/docs');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('swagger-ui-bundle.js');
    expect(res.text).toContain('/docs/swagger-init.js');
  });

  it('serve a especificação em JSON', async () => {
    const res = await request(criarApp()).get('/docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths)).toEqual(Object.keys(spec.paths));
  });
});

describe('especificação OpenAPI', () => {
  it('todas as referências apontam para algo que existe', () => {
    const quebradas = referencias(spec).filter((item) => resolver(item) === undefined);

    expect(quebradas).toEqual([]);
  });

  it.each(operacoes)('$metodo $caminho está completa', ({ caminho, operacao }) => {
    expect(operacao.summary).toBeTruthy();
    expect(Object.keys(operacao.responses).length).toBeGreaterThan(0);
    expect(operacao.tags.every((tag) => spec.tags.some((item) => item.name === tag))).toBe(true);

    const declarados = (operacao.parameters || [])
      .map((item) => resolver(item.$ref || '') || item)
      .filter((item) => item.in === 'path')
      .map((item) => item.name);
    const usados = [...caminho.matchAll(/\{(\w+)\}/g)].map((item) => item[1]);

    expect(declarados.sort()).toEqual(usados.sort());
  });

  it.each(operacoes.filter(({ operacao }) => operacao.security))(
    '$metodo $caminho documenta o 401',
    ({ operacao }) => {
      expect(operacao.responses[401]).toBeDefined();
    },
  );

  it.each(operacoes)('$metodo $caminho existe na API', async ({ caminho, metodo }) => {
    const url = caminho.replace(/\{\w+\}/g, 'abc');

    const res = await request(criarApp())
      [metodo](url)
      .set('Authorization', 'Bearer token-admin')
      .send({});

    expect(res.body.error).not.toBe('Rota não encontrada');
  });
});
