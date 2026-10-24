const { Event } = require('../../src/domain/entities/Event');
const { EventRepository } = require('../../src/domain/repositories/EventRepository');

// Repositório falso, só para os testes
class InMemoryEventRepository extends EventRepository {
  constructor() {
    super();
    this.events = [];
  }

  async create(event) {
    const salvo = new Event({ ...event, id: `evento-${this.events.length + 1}` });
    this.events.push(salvo);
    return salvo;
  }

  async findById(id) {
    return this.events.find((evento) => evento.id === id) || null;
  }

  async findByOrganizer(organizerId) {
    return this.events.filter((evento) => evento.organizerId === organizerId);
  }
}

module.exports = { InMemoryEventRepository };
