const { NotFoundError } = require('../../domain/errors');

const ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

async function findGift({ giftRepository, eventId, giftId }) {
  if (!ID_VALIDO.test(giftId)) throw new NotFoundError('Presente não encontrado');

  const gift = await giftRepository.findById(eventId, giftId);
  if (!gift) throw new NotFoundError('Presente não encontrado');

  return gift;
}

module.exports = { findGift };
