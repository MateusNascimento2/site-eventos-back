class GuestRepository {
  // add(eventId, guest) -> Guest com id
  async add() {
    throw new Error('GuestRepository.add não implementado');
  }

  // findById(eventId, guestId) -> Guest ou null
  async findById() {
    throw new Error('GuestRepository.findById não implementado');
  }

  // update(eventId, guestId, dados) -> Guest
  async update() {
    throw new Error('GuestRepository.update não implementado');
  }

  // delete(eventId, guestId)
  async delete() {
    throw new Error('GuestRepository.delete não implementado');
  }

  // listByEvent(eventId) -> Guest[]
  async listByEvent() {
    throw new Error('GuestRepository.listByEvent não implementado');
  }
}

module.exports = { GuestRepository };
