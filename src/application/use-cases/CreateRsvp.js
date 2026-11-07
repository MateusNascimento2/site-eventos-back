const { Guest } = require('../../domain/entities/Guest');
const { findInviteEvent } = require('./findInviteEvent');
const { guestKey } = require('./guestKey');

class CreateRsvp {
  constructor({ eventRepository, guestRepository }) {
    this.eventRepository = eventRepository;
    this.guestRepository = guestRepository;
  }

  async execute({ slug, name, email, phone, confirmed, plusOne }) {
    const event = await findInviteEvent({ eventRepository: this.eventRepository, slug });

    const guest = new Guest({ name, email, phone, confirmed, plusOne });

    await this.guestRepository.add(event.id, new Guest({ ...guest, id: guestKey(guest) }));

    return { name: guest.name, confirmed: guest.confirmed, plusOne: guest.plusOne };
  }
}

module.exports = { CreateRsvp };
