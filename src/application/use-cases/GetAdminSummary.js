class GetAdminSummary {
  constructor({ organizerRepository, eventRepository }) {
    this.organizerRepository = organizerRepository;
    this.eventRepository = eventRepository;
  }

  async execute() {
    const [organizers, events] = await Promise.all([
      this.organizerRepository.findAll(),
      this.eventRepository.findAll(),
    ]);

    return {
      organizers: organizers.length,
      events: events.length,
      activeInvites: events.filter((evento) => evento.slug !== null).length,
      pixEnabled: events.filter((evento) => evento.pixEnabled).length,
    };
  }
}

module.exports = { GetAdminSummary };
