const { GuestRepository } = require('../../src/domain/repositories/GuestRepository');
const { ConflictError } = require('../../src/domain/errors');

// Repositório falso, só para os testes
class InMemoryGuestRepository extends GuestRepository {
  constructor() {
    super();
    this.guests = [];
  }

  async add(eventId, guest) {
    if (this.guests.some((g) => g.eventId === eventId && g.guest.id === guest.id)) {
      throw new ConflictError('Esse e-mail já confirmou presença');
    }
    this.guests.push({ eventId, guest });
    return guest;
  }

  async listByEvent(eventId) {
    return this.guests.filter((g) => g.eventId === eventId).map((g) => g.guest);
  }
}

module.exports = { InMemoryGuestRepository };
