const { NotFoundError } = require('../../domain/errors');

const SLUG_VALIDO = /^[A-Za-z0-9_-]{12}$/;

async function findInviteEvent({ eventRepository, slug }) {
  if (!SLUG_VALIDO.test(slug)) throw new NotFoundError('Convite não encontrado');

  const event = await eventRepository.findBySlug(slug);
  if (!event) throw new NotFoundError('Convite não encontrado');

  return event;
}

module.exports = { findInviteEvent };
