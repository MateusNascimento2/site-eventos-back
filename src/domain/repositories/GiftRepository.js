class GiftRepository {
  // create(eventId, gift) -> Gift com id
  async create() {
    console.log('create');
  }

  // listByEvent(eventId) -> Gift[]
  async listByEvent() {
    console.log('listByEvent');
  }

  // update(eventId, giftId, dados) -> Gift
  async update() {
    console.log('update');
  }

  // delete(eventId, giftId)
  async delete() {
    console.log('delete');
  }
}

module.exports = { GiftRepository };
