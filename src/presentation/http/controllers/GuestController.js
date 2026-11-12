const { ValidationError } = require('../../../domain/errors');

const FILTROS = { true: true, false: false };

function paraResposta(guest) {
  return { id: guest.id, ...guest.toPlain() };
}

class GuestController {
  constructor({ listGuests, getEventSummary }) {
    this.listGuests = listGuests;
    this.getEventSummary = getEventSummary;
  }

  list = async (req, res) => {
    const { confirmed } = req.query;
    if (confirmed !== undefined && !(confirmed in FILTROS)) {
      throw new ValidationError('confirmed deve ser true ou false');
    }

    const guests = await this.listGuests.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      confirmed: confirmed === undefined ? undefined : FILTROS[confirmed],
    });

    res.set('Cache-Control', 'no-store');
    res.json(guests.map(paraResposta));
  };

  summary = async (req, res) => {
    const resumo = await this.getEventSummary.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
    });

    res.set('Cache-Control', 'no-store');
    res.json(resumo);
  };
}

module.exports = { GuestController };
