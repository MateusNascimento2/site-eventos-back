class GuestRepository {
  // add(eventId, guest) -> Guest com id
  async add() {
    console.log('add');
  }

  // findById(eventId, guestId) -> Guest ou null
  async findById() {
    console.log('findById');
  }

  // update(eventId, guestId, dados) -> Guest
  async update() {
    console.log('update');
  }

  // listByEvent(eventId) -> Guest[]
  async listByEvent() {
    console.log('listByEvent');
  }
}

module.exports = { GuestRepository };
