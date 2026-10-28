const { OrganizerRepository } = require('../../src/domain/repositories/OrganizerRepository');

// Repositório falso, só para os testes
class InMemoryOrganizerRepository extends OrganizerRepository {
  constructor() {
    super();
    this.organizers = {};
  }

  async create(organizer) {
    this.organizers[organizer.id] = organizer;
    return organizer;
  }

  async findById(id) {
    return this.organizers[id] || null;
  }
}

module.exports = { InMemoryOrganizerRepository };
