class ListEvents {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute({ organizerId }) {
    return this.eventRepository.findByOrganizer(organizerId);
  }
}

module.exports = { ListEvents };
