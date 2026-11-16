class ListAllEvents {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute() {
    const events = await this.eventRepository.findAll();
    return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

module.exports = { ListAllEvents };
