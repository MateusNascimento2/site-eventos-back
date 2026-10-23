class GuestRepository {
  // add(eventId, guest) -> Guest com id
  async add() {
    console.log('add');
  }

  // listByEvent(eventId) -> Guest[]
  async listByEvent() {
    console.log('listByEvent');
  }
}

module.exports = { GuestRepository };
