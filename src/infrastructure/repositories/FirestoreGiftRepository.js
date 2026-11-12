const { Gift } = require('../../domain/entities/Gift');
const { GiftRepository } = require('../../domain/repositories/GiftRepository');

const COLECAO = 'events';
const SUBCOLECAO = 'gifts';

function paraPresente(doc) {
  return new Gift({ id: doc.id, ...doc.data() });
}

class FirestoreGiftRepository extends GiftRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  gifts(eventId) {
    return this.db.collection(COLECAO).doc(eventId).collection(SUBCOLECAO);
  }

  async create(eventId, gift) {
    const ref = this.gifts(eventId).doc();
    await ref.set(gift.toPlain());
    return new Gift({ ...gift, id: ref.id });
  }

  async findById(eventId, giftId) {
    const doc = await this.gifts(eventId).doc(giftId).get();
    return doc.exists ? paraPresente(doc) : null;
  }

  async listByEvent(eventId) {
    const snapshot = await this.gifts(eventId).get();
    return snapshot.docs.map(paraPresente).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async update(eventId, giftId, dados) {
    await this.gifts(eventId).doc(giftId).update(dados);
    return this.findById(eventId, giftId);
  }

  async delete(eventId, giftId) {
    await this.gifts(eventId).doc(giftId).delete();
  }
}

module.exports = { FirestoreGiftRepository };
