const { Gift } = require('../../src/domain/entities/Gift');
const { GiftRepository } = require('../../src/domain/repositories/GiftRepository');

// Repositório falso, só para os testes
class InMemoryGiftRepository extends GiftRepository {
  constructor() {
    super();
    this.gifts = [];
    this.contador = 0;
  }

  async create(eventId, gift) {
    const criado = new Gift({ ...gift, id: `presente-${++this.contador}` });
    this.gifts.push({ eventId, gift: criado });
    return criado;
  }

  async findById(eventId, giftId) {
    const achado = this.gifts.find((g) => g.eventId === eventId && g.gift.id === giftId);
    return achado ? achado.gift : null;
  }

  async listByEvent(eventId) {
    return this.gifts.filter((g) => g.eventId === eventId).map((g) => g.gift);
  }

  async update(eventId, giftId, dados) {
    const achado = this.gifts.find((g) => g.eventId === eventId && g.gift.id === giftId);
    achado.gift = new Gift({ ...achado.gift, ...dados });
    return achado.gift;
  }

  async delete(eventId, giftId) {
    this.gifts = this.gifts.filter((g) => !(g.eventId === eventId && g.gift.id === giftId));
  }
}

module.exports = { InMemoryGiftRepository };
