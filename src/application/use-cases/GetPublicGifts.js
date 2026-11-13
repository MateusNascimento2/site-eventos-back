const { findInviteEvent } = require('./findInviteEvent');

class GetPublicGifts {
  constructor({ eventRepository, giftRepository }) {
    this.eventRepository = eventRepository;
    this.giftRepository = giftRepository;
  }

  async execute({ slug }) {
    const event = await findInviteEvent({ eventRepository: this.eventRepository, slug });
    const gifts = await this.giftRepository.listByEvent(event.id);

    return {
      gifts: gifts.map((g) => ({ id: g.id, name: g.name, description: g.description })),
      // O Pix só aparece quando o organizador habilitou
      pix: event.pixEnabled ? { key: event.pixKey, whatsapp: event.whatsapp } : null,
    };
  }
}

module.exports = { GetPublicGifts };
