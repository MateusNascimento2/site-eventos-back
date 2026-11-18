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

  // delete(eventId, guestId)
  async delete() {
    console.log('delete');
  }

  // listByEvent(eventId) -> Guest[]
  async listByEvent() {
    console.log('listByEvent');
  }
}

module.exports = { GuestRepository };
