const { findGuest } = require('./findGuest');

class DeleteGuest {
  constructor({ guestRepository, getEvent }) {
    this.guestRepository = guestRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, guestId }) {
    await this.getEvent.execute({ eventId, organizerId });
    await findGuest({ guestRepository: this.guestRepository, eventId, guestId });
    await this.guestRepository.delete(eventId, guestId);
  }
}

module.exports = { DeleteGuest };
