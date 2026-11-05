class DisableInvite {
  constructor({ eventRepository, getEvent }) {
    this.eventRepository = eventRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId }) {
    const event = await this.getEvent.execute({ eventId, organizerId });

    if (event.slug) await this.eventRepository.update(eventId, { slug: null });
  }
}

module.exports = { DisableInvite };
