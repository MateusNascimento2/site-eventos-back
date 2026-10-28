class DeleteEvent {
  constructor({ eventRepository, getEvent }) {
    this.eventRepository = eventRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId }) {
    await this.getEvent.execute({ eventId, organizerId });
    await this.eventRepository.delete(eventId);
  }
}

module.exports = { DeleteEvent };
