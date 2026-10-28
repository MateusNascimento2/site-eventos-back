const { Organizer } = require('../../domain/entities/Organizer');
const { ConflictError } = require('../../domain/errors');

class CreateOrganizer {
  constructor({ organizerRepository }) {
    this.organizerRepository = organizerRepository;
  }

  async execute({ uid, email, name }) {
    const organizer = new Organizer({ id: uid, name, email });

    if (await this.organizerRepository.findById(uid)) {
      throw new ConflictError('Organizador já cadastrado');
    }

    return this.organizerRepository.create(organizer);
  }
}

module.exports = { CreateOrganizer };
