const { Event } = require('../../domain/entities/Event');
const { ValidationError } = require('../../domain/errors');

const CAMPOS_EDITAVEIS = ['title', 'date', 'location', 'description', 'layout'];

class UpdateEvent {
  constructor({ eventRepository, getEvent }) {
    this.eventRepository = eventRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, dados = {} }) {
    const event = await this.getEvent.execute({ eventId, organizerId });

    const alteracoes = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    }
    if (Object.keys(alteracoes).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualizar');
    }

    // Reaproveita as validações da entidade
    const atualizado = new Event({ ...event, ...alteracoes });

    return this.eventRepository.update(
      eventId,
      Object.fromEntries(CAMPOS_EDITAVEIS.map((campo) => [campo, atualizado[campo]])),
    );
  }
}

module.exports = { UpdateEvent };
