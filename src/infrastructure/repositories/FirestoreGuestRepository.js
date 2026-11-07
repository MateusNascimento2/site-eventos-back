const { Guest } = require('../../domain/entities/Guest');
const { GuestRepository } = require('../../domain/repositories/GuestRepository');
const { ConflictError } = require('../../domain/errors');

const COLECAO = 'events';
const SUBCOLECAO = 'guests';
const JA_EXISTE = 6;

function paraConvidado(doc) {
  return new Guest({ id: doc.id, ...doc.data() });
}

class FirestoreGuestRepository extends GuestRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  guests(eventId) {
    return this.db.collection(COLECAO).doc(eventId).collection(SUBCOLECAO);
  }

  async add(eventId, guest) {
    try {
      await this.guests(eventId).doc(guest.id).create(guest.toPlain());
    } catch (erro) {
      if (erro.code === JA_EXISTE) throw new ConflictError('Esse e-mail já confirmou presença');
      throw erro;
    }
    return guest;
  }

  async listByEvent(eventId) {
    const snapshot = await this.guests(eventId).get();
    return snapshot.docs.map(paraConvidado).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

module.exports = { FirestoreGuestRepository };
