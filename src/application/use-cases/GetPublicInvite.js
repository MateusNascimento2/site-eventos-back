const { NotFoundError } = require('../../domain/errors');

const SLUG_VALIDO = /^[A-Za-z0-9_-]{12}$/;

class GetPublicInvite {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute({ slug }) {
    if (!SLUG_VALIDO.test(slug)) throw new NotFoundError('Convite não encontrado');

    const event = await this.eventRepository.findBySlug(slug);
    if (!event) throw new NotFoundError('Convite não encontrado');

    return {
      slug: event.slug,
      title: event.title,
      date: event.date,
      location: event.location,
      description: event.description,
      layout: event.layout,
    };
  }
}

module.exports = { GetPublicInvite };
