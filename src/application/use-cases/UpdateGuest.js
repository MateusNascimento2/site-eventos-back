const { Guest } = require('../../domain/entities/Guest');
const { ValidationError } = require('../../domain/errors');
const { findGuest } = require('./findGuest');

// O e-mail não muda: ele identifica o convidado
const CAMPOS_EDITAVEIS = ['name', 'phone', 'confirmed', 'plusOne'];

class UpdateGuest {
  constructor({ guestRepository, getEvent }) {
    this.guestRepository = guestRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, guestId, dados = {} }) {
    await this.getEvent.execute({ eventId, organizerId });
    const guest = await findGuest({ guestRepository: this.guestRepository, eventId, guestId });

    const alteracoes = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    }
    if (Object.keys(alteracoes).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualizar');
    }

    // Quem passa a recusar deixa de levar acompanhante
    if (alteracoes.confirmed === false && alteracoes.plusOne === undefined) {
      alteracoes.plusOne = false;
    }

    // Reaproveita as validações da entidade
    const atualizado = new Guest({ ...guest, ...alteracoes });

    return this.guestRepository.update(eventId, guestId, {
      name: atualizado.name,
      phone: atualizado.phone,
      confirmed: atualizado.confirmed,
      plusOne: atualizado.plusOne,
    });
  }
}

module.exports = { UpdateGuest };
