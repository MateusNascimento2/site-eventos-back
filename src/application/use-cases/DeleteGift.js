const { findGift } = require('./findGift');

class DeleteGift {
  constructor({ giftRepository, getEvent }) {
    this.giftRepository = giftRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, giftId }) {
    await this.getEvent.execute({ eventId, organizerId });
    await findGift({ giftRepository: this.giftRepository, eventId, giftId });
    await this.giftRepository.delete(eventId, giftId);
  }
}

module.exports = { DeleteGift };
