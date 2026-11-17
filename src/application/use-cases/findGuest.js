const { NotFoundError } = require('../../domain/errors');

const ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

async function findGuest({ guestRepository, eventId, guestId }) {
  if (!ID_VALIDO.test(guestId)) throw new NotFoundError('Convidado não encontrado');

  const guest = await guestRepository.findById(eventId, guestId);
  if (!guest) throw new NotFoundError('Convidado não encontrado');

  return guest;
}

module.exports = { findGuest };
