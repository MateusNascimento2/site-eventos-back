class ListAllOrganizers {
  constructor({ organizerRepository }) {
    this.organizerRepository = organizerRepository;
  }

  async execute() {
    const organizers = await this.organizerRepository.findAll();
    return organizers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

module.exports = { ListAllOrganizers };
