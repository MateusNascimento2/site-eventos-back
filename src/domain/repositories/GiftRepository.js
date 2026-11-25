class GiftRepository {
  // create(eventId, gift) -> Gift com id
  async create() {
    throw new Error('GiftRepository.create não implementado');
  }

  // findById(eventId, giftId) -> Gift ou null
  async findById() {
    throw new Error('GiftRepository.findById não implementado');
  }

  // listByEvent(eventId) -> Gift[]
  async listByEvent() {
    throw new Error('GiftRepository.listByEvent não implementado');
  }

  // update(eventId, giftId, dados) -> Gift
  async update() {
    throw new Error('GiftRepository.update não implementado');
  }

  // delete(eventId, giftId)
  async delete() {
    throw new Error('GiftRepository.delete não implementado');
  }
}

module.exports = { GiftRepository };
