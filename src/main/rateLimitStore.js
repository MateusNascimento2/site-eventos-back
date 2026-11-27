const {
  FirestoreRateLimitStore,
} = require('../infrastructure/repositories/FirestoreRateLimitStore');

// Só carrega o Firebase no primeiro uso, como no container
const lazyDb = {
  collection: (nome) => require('../infrastructure/firebase/firebase').db.collection(nome),
  runTransaction: (funcao) =>
    require('../infrastructure/firebase/firebase').db.runTransaction(funcao),
};

function createRateLimitStore(env = process.env) {
  if (env.RATE_LIMIT_STORE === 'memory') return null;
  return new FirestoreRateLimitStore(lazyDb);
}

module.exports = { createRateLimitStore };
