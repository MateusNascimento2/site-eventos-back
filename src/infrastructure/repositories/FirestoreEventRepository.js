const { Event } = require('../../domain/entities/Event');
const { EventRepository } = require('../../domain/repositories/EventRepository');

const COLECAO = 'events';

function paraEvento(doc) {
  return new Event({ id: doc.id, ...doc.data() });
}

class FirestoreEventRepository extends EventRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async create(event) {
    const ref = this.db.collection(COLECAO).doc();
    await ref.set(event.toPlain());
    return new Event({ ...event, id: ref.id });
  }

  async findById(id) {
    const doc = await this.db.collection(COLECAO).doc(id).get();
    return doc.exists ? paraEvento(doc) : null;
  }

  async findByOrganizer(organizerId) {
    const snapshot = await this.db
      .collection(COLECAO)
      .where('organizerId', '==', organizerId)
      .get();

    // Ordena por data aqui para não exigir índice composto no Firestore
    return snapshot.docs.map(paraEvento).sort((a, b) => a.date.localeCompare(b.date));
  }

  async update(id, dados) {
    const ref = this.db.collection(COLECAO).doc(id);
    await ref.update(dados);
    return this.findById(id);
  }

  async delete(id) {
    // Apaga também as subcoleções guests e gifts
    await this.db.recursiveDelete(this.db.collection(COLECAO).doc(id));
  }
}

module.exports = { FirestoreEventRepository };
