const { findInviteEvent } = require('./findInviteEvent');

class GetPublicInvite {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute({ slug }) {
    const event = await findInviteEvent({ eventRepository: this.eventRepository, slug });

    // Só o que o convidado pode ver: nada de organizerId, id interno ou dados de Pix
    return {
      slug: event.slug,
      title: event.title,
      date: event.date,
      location: event.location,
      description: event.description,
      layout: event.layout,
    };
  }
}

module.exports = { GetPublicInvite };
