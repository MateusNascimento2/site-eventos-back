class EventRepository {
  // create(event) -> Event com id
  async create() {
    console.log('create');
  }

  // findById(id) -> Event ou null
  async findById() {
    console.log('findById');
  }

  // findBySlug(slug) -> Event ou null
  async findBySlug() {
    console.log('findBySlug');
  }

  // findByOrganizer(organizerId) -> Event[]
  async findByOrganizer() {
    console.log('findByOrganizer');
  }

  // update(id, dados) -> Event
  async update() {
    console.log('update');
  }

  // delete(id)
  async delete() {
    console.log('delete');
  }
}

module.exports = { EventRepository };
