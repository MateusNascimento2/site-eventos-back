const { ValidationError } = require('../../domain/errors');

class ListGuests {
  constructor({ guestRepository, getEvent }) {
    this.guestRepository = guestRepository;
    this.getEvent = getEvent;
  }

  // confirmed: undefined lista todos, true só quem vai, false só quem não vai
  async execute({ eventId, organizerId, confirmed }) {
    if (confirmed !== undefined && typeof confirmed !== 'boolean') {
      throw new ValidationError('confirmed deve ser true ou false');
    }

    await this.getEvent.execute({ eventId, organizerId });
    const guests = await this.guestRepository.listByEvent(eventId);

    return confirmed === undefined ? guests : guests.filter((g) => g.confirmed === confirmed);
  }
}

module.exports = { ListGuests };
