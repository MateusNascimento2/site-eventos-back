const { Gift } = require('../../domain/entities/Gift');
const { ValidationError } = require('../../domain/errors');
const { findGift } = require('./findGift');

const CAMPOS_EDITAVEIS = ['name', 'description'];

class UpdateGift {
  constructor({ giftRepository, getEvent }) {
    this.giftRepository = giftRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, giftId, dados = {} }) {
    await this.getEvent.execute({ eventId, organizerId });
    const gift = await findGift({ giftRepository: this.giftRepository, eventId, giftId });

    const alteracoes = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    }
    if (Object.keys(alteracoes).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualizar');
    }

    // Reaproveita as validações da entidade
    const atualizado = new Gift({ ...gift, ...alteracoes });

    return this.giftRepository.update(eventId, giftId, {
      name: atualizado.name,
      description: atualizado.description,
    });
  }
}

module.exports = { UpdateGift };
