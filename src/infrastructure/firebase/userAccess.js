const { NotFoundError } = require('../../domain/errors');

// Bloqueia ou libera o login no Firebase Auth. Ao bloquear, derruba as sessões abertas
async function setUserDisabled(uid, disabled) {
  const { auth } = require('./firebase');

  try {
    await auth.updateUser(uid, { disabled });
    if (disabled) await auth.revokeRefreshTokens(uid);
  } catch (erro) {
    if (erro.code === 'auth/user-not-found') {
      throw new NotFoundError('Usuário não encontrado no Firebase Auth');
    }
    throw erro;
  }
}

module.exports = { setUserDisabled };
