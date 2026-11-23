const { ValidationError } = require('../../domain/errors');

// Busca sem diferenciar maiúsculas e acentos
function paraBusca(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

class ListGuests {
  constructor({ guestRepository, getEvent }) {
    this.guestRepository = guestRepository;
    this.getEvent = getEvent;
  }

  async execute({ eventId, organizerId, confirmed, search, page = 1, limit }) {
    if (confirmed !== undefined && typeof confirmed !== 'boolean') {
      throw new ValidationError('confirmed deve ser true ou false');
    }

    await this.getEvent.execute({ eventId, organizerId });
    let guests = await this.guestRepository.listByEvent(eventId);

    if (confirmed !== undefined) guests = guests.filter((g) => g.confirmed === confirmed);

    const termo = search ? paraBusca(search) : '';
    if (termo) {
      guests = guests.filter((g) => paraBusca(`${g.name} ${g.email}`).includes(termo));
    }

    const total = guests.length;
    if (limit === undefined) return { guests, total, page: 1, totalPages: 1 };

    const inicio = (page - 1) * limit;
    return {
      guests: guests.slice(inicio, inicio + limit),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}

module.exports = { ListGuests };
