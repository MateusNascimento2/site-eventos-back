const { Organizer } = require('../../src/domain/entities/Organizer');
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

  async update(id, dados) {
    this.organizers[id] = new Organizer({ ...this.organizers[id], ...dados });
    return this.organizers[id];
  }

  async findAll() {
    return Object.values(this.organizers);
  }
}

module.exports = { InMemoryOrganizerRepository };
