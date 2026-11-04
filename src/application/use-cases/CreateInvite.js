const { uniqueSlug } = require('./uniqueSlug');

class CreateInvite {
  constructor({ eventRepository, getEvent, generateSlug }) {
    this.eventRepository = eventRepository;
    this.getEvent = getEvent;
    this.generateSlug = generateSlug;
  }

  async execute({ eventId, organizerId }) {
    const event = await this.getEvent.execute({ eventId, organizerId });

    // Se o convite já existe, devolve o mesmo link
    if (event.slug) return { event, created: false };

    const slug = await uniqueSlug({
      eventRepository: this.eventRepository,
      generateSlug: this.generateSlug,
    });
    const atualizado = await this.eventRepository.update(eventId, { slug });

    return { event: atualizado, created: true };
  }
}

module.exports = { CreateInvite };
