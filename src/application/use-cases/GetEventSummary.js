class GetEventSummary {
  constructor({ guestRepository, getEvent }) {
    this.guestRepository = guestRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId }) {
    await this.getEvent.execute({ eventId, organizerId });
    const guests = await this.guestRepository.listByEvent(eventId);

    const confirmed = guests.filter((g) => g.confirmed).length;
    const plusOnes = guests.filter((g) => g.plusOne).length;

    return {
      total: guests.length,
      confirmed,
      declined: guests.length - confirmed,
      plusOnes,
      attending: confirmed + plusOnes,
    };
  }
}

module.exports = { GetEventSummary };
