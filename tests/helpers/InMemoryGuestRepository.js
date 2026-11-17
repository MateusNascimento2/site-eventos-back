const { Guest } = require('../../src/domain/entities/Guest');
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

  async findById(eventId, guestId) {
    const item = this.guests.find((g) => g.eventId === eventId && g.guest.id === guestId);
    return item ? item.guest : null;
  }

  async update(eventId, guestId, dados) {
    const item = this.guests.find((g) => g.eventId === eventId && g.guest.id === guestId);
    item.guest = new Guest({ ...item.guest, ...dados });
    return item.guest;
  }

  async listByEvent(eventId) {
    return this.guests.filter((g) => g.eventId === eventId).map((g) => g.guest);
  }
}

module.exports = { InMemoryGuestRepository };
