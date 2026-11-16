const { ForbiddenError } = require('../../../domain/errors');

function requireAdmin(req, res, next) {
  if (req.user?.admin !== true)
    return next(new ForbiddenError('Acesso restrito a administradores'));
  return next();
}

module.exports = { requireAdmin };
