const { NotFoundError } = require('../../domain/errors');

class GetOrganizer {
  constructor({ organizerRepository }) {
    this.organizerRepository = organizerRepository;
  }

  async execute({ uid }) {
    const organizer = await this.organizerRepository.findById(uid);
    if (!organizer) throw new NotFoundError('Organizador não encontrado');
    return organizer;
  }
}

module.exports = { GetOrganizer };
