const { uniqueSlug } = require('./uniqueSlug');

class RegenerateInvite {
  constructor({ eventRepository, getEvent, generateSlug }) {
    this.eventRepository = eventRepository;
    this.getEvent = getEvent;
    this.generateSlug = generateSlug;
  }

  async execute({ eventId, organizerId }) {
    await this.getEvent.execute({ eventId, organizerId });

    // O slug antigo deixa de existir, então o link antigo para de funcionar
    const slug = await uniqueSlug({
      eventRepository: this.eventRepository,
      generateSlug: this.generateSlug,
    });

    return this.eventRepository.update(eventId, { slug });
  }
}

module.exports = { RegenerateInvite };
