const crypto = require('crypto');

const COLECAO = 'rateLimits';

class FirestoreRateLimitStore {
  constructor(db) {
    this.db = db;
  }

  // O id é o hash da chave, então o IP não fica gravado em texto no banco
  async hit(chave, { windowMs, max, agora }) {
    const id = crypto.createHash('sha256').update(chave).digest('hex');
    const ref = this.db.collection(COLECAO).doc(id);

    return this.db.runTransaction(async (transacao) => {
      const snapshot = await transacao.get(ref);
      const atual = snapshot.exists ? snapshot.data() : null;

      if (!atual || atual.fim <= agora) {
        const fim = agora + windowMs;
        transacao.set(ref, { total: 1, fim, expiraEm: new Date(fim + windowMs) });
        return { total: 1, fim };
      }

      const total = atual.total + 1;
      // Depois de passar do limite não precisa gravar de novo, só ler
      if (atual.total <= max) transacao.update(ref, { total });
      return { total, fim: atual.fim };
    });
  }
}

module.exports = { FirestoreRateLimitStore, COLECAO };
