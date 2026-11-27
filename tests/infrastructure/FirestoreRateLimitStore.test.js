const crypto = require('crypto');
const { FakeFirestore } = require('../helpers/FakeFirestore');
const {
  FirestoreRateLimitStore,
  COLECAO,
} = require('../../src/infrastructure/repositories/FirestoreRateLimitStore');

const JANELA = 1000;

describe('FirestoreRateLimitStore', () => {
  let db;
  let store;

  beforeEach(() => {
    db = new FakeFirestore();
    store = new FirestoreRateLimitStore(db);
  });

  it('começa a contagem em 1 e soma a cada acesso na mesma janela', async () => {
    const primeiro = await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 100 });
    const segundo = await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 200 });

    expect(primeiro).toEqual({ total: 1, fim: 1100 });
    expect(segundo).toEqual({ total: 2, fim: 1100 });
  });

  it('separa as chaves', async () => {
    await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 100 });
    const outra = await store.hit('ip:2.2.2.2', { windowMs: JANELA, max: 5, agora: 100 });

    expect(outra.total).toBe(1);
  });

  it('abre uma janela nova quando a anterior vence', async () => {
    await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 100 });
    const depois = await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 1100 });

    expect(depois).toEqual({ total: 1, fim: 2100 });
  });

  it('guarda o hash da chave e não o IP', async () => {
    await store.hit('ip:203.0.113.9', { windowMs: JANELA, max: 5, agora: 100 });

    const id = crypto.createHash('sha256').update('ip:203.0.113.9').digest('hex');
    expect(Object.keys(db.dados[COLECAO])).toEqual([id]);
    expect(JSON.stringify(db.dados)).not.toContain('203.0.113.9');
  });

  it('grava a data de expiração para o TTL do Firestore apagar sozinho', async () => {
    await store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 5, agora: 100 });

    const [documento] = Object.values(db.dados[COLECAO]);
    expect(documento.expiraEm).toEqual(new Date(2100));
  });

  it('passando do limite continua contando, mas deixa de gravar', async () => {
    const hit = () => store.hit('ip:1.1.1.1', { windowMs: JANELA, max: 2, agora: 100 });

    await hit();
    await hit();
    await hit();
    const [documento] = Object.values(db.dados[COLECAO]);
    expect(documento.total).toBe(3);

    const bloqueado = await hit();
    expect(bloqueado.total).toBe(4);
    expect(Object.values(db.dados[COLECAO])[0].total).toBe(3);
  });
});
