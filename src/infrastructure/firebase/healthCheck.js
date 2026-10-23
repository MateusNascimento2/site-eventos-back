// Verifica se o backend consegue ler o Firestore com as credenciais configuradas.
// O Firebase é carregado sob demanda para não exigir variáveis de ambiente nos testes.
async function checkDatabase() {
  const { db } = require('./firebase');
  await db.collection('events').limit(1).get();
}

module.exports = { checkDatabase };
