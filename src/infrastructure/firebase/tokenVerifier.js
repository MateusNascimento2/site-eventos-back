// Valida o token do Firebase Auth e devolve o usuário
async function verifyToken(token) {
  const { auth } = require('./firebase');
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email || null };
}

module.exports = { verifyToken };
