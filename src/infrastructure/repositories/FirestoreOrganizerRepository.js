const { Organizer } = require('../../domain/entities/Organizer');
const { OrganizerRepository } = require('../../domain/repositories/OrganizerRepository');

const COLECAO = 'organizers';

class FirestoreOrganizerRepository extends OrganizerRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async create(organizer) {
    // O id do documento é o uid do Firebase Auth
    await this.db.collection(COLECAO).doc(organizer.id).set(organizer.toPlain());
    return organizer;
  }

  async findById(id) {
    const doc = await this.db.collection(COLECAO).doc(id).get();
    return doc.exists ? new Organizer({ id: doc.id, ...doc.data() }) : null;
  }
}

module.exports = { FirestoreOrganizerRepository };
