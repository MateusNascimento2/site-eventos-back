const { NotFoundError } = require('../../domain/errors');

const ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

class GetEvent {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute({ eventId, organizerId }) {
    if (!ID_VALIDO.test(eventId)) throw new NotFoundError('Evento não encontrado');

    const event = await this.eventRepository.findById(eventId);

    // 404 também para evento de outro organizador, para não revelar que existe
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundError('Evento não encontrado');
    }

    return event;
  }
}

module.exports = { GetEvent };
