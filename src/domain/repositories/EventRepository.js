class EventRepository {
  // create(event) -> Event com id
  async create() {
    throw new Error('EventRepository.create não implementado');
  }

  // findById(id) -> Event ou null
  async findById() {
    throw new Error('EventRepository.findById não implementado');
  }

  // findBySlug(slug) -> Event ou null
  async findBySlug() {
    throw new Error('EventRepository.findBySlug não implementado');
  }

  // findByOrganizer(organizerId) -> Event[]
  async findByOrganizer() {
    throw new Error('EventRepository.findByOrganizer não implementado');
  }

  // findAll() -> Event[]
  async findAll() {
    throw new Error('EventRepository.findAll não implementado');
  }

  // update(id, dados) -> Event
  async update() {
    throw new Error('EventRepository.update não implementado');
  }

  // delete(id)
  async delete() {
    throw new Error('EventRepository.delete não implementado');
  }
}

module.exports = { EventRepository };
