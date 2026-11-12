class ListGifts {
  constructor({ giftRepository, getEvent }) {
    this.giftRepository = giftRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId }) {
    await this.getEvent.execute({ eventId, organizerId });
    return this.giftRepository.listByEvent(eventId);
  }
}

module.exports = { ListGifts };
