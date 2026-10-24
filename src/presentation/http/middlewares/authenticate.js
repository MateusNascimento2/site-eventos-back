const { UnauthorizedError } = require('../../../domain/errors');

function createAuthenticate({ verifyToken }) {
  return async function authenticate(req, res, next) {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Token não informado'));
    }

    try {
      req.user = await verifyToken(token);
      return next();
    } catch {
      return next(new UnauthorizedError('Token inválido'));
    }
  };
}

module.exports = { createAuthenticate };
