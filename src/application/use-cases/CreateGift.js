const { Gift } = require('../../domain/entities/Gift');
const { ValidationError } = require('../../domain/errors');

const MAXIMO_POR_EVENTO = 50;

class CreateGift {
  constructor({ giftRepository, getEvent }) {
    this.giftRepository = giftRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, name, description }) {
    await this.getEvent.execute({ eventId, organizerId });

    const gift = new Gift({ name, description });

    const existentes = await this.giftRepository.listByEvent(eventId);
    if (existentes.length >= MAXIMO_POR_EVENTO) {
      throw new ValidationError(`O evento já tem o máximo de ${MAXIMO_POR_EVENTO} presentes`);
    }

    return this.giftRepository.create(eventId, gift);
  }
}

module.exports = { CreateGift, MAXIMO_POR_EVENTO };
