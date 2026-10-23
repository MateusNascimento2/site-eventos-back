// Verifica se o backend consegue ler o Firestore com as credenciais configuradas.
async function checkDatabase() {
  const { db } = require('./firebase');
  await db.collection('events').limit(1).get();
}

module.exports = { checkDatabase };
