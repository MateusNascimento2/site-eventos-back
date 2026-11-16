const { Organizer } = require('../../domain/entities/Organizer');
const { OrganizerRepository } = require('../../domain/repositories/OrganizerRepository');

const COLECAO = 'organizers';
const LIMITE_ADMIN = 500;

class FirestoreOrganizerRepository extends OrganizerRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async create(organizer) {
    await this.db.collection(COLECAO).doc(organizer.id).set(organizer.toPlain());
    return organizer;
  }

  async findById(id) {
    const doc = await this.db.collection(COLECAO).doc(id).get();
    return doc.exists ? new Organizer({ id: doc.id, ...doc.data() }) : null;
  }

  async update(id, dados) {
    await this.db.collection(COLECAO).doc(id).update(dados);
    return this.findById(id);
  }

  async findAll() {
    const snapshot = await this.db.collection(COLECAO).limit(LIMITE_ADMIN).get();
    return snapshot.docs.map((doc) => new Organizer({ id: doc.id, ...doc.data() }));
  }
}

module.exports = { FirestoreOrganizerRepository };
