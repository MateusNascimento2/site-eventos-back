const { ValidationError } = require('../../../domain/errors');

const FILTROS = { true: true, false: false };
const BUSCA_MAXIMA = 100;
const LIMITE_MAXIMO = 100;

function numeroInteiro(valor, campo, maximo) {
  if (typeof valor !== 'string' || !/^\d{1,6}$/.test(valor) || Number(valor) < 1) {
    throw new ValidationError(`${campo} deve ser um número inteiro maior que zero`);
  }
  if (maximo && Number(valor) > maximo) {
    throw new ValidationError(`${campo} deve ser no máximo ${maximo}`);
  }
  return Number(valor);
}

function paraResposta(guest) {
  return { id: guest.id, ...guest.toPlain() };
}

class GuestController {
  constructor({ listGuests, getEventSummary, updateGuest, deleteGuest }) {
    this.listGuests = listGuests;
    this.updateGuest = updateGuest;
    this.deleteGuest = deleteGuest;
    this.getEventSummary = getEventSummary;
  }

  list = async (req, res) => {
    const { confirmed } = req.query;
    if (confirmed !== undefined && !(confirmed in FILTROS)) {
      throw new ValidationError('confirmed deve ser true ou false');
    }

    const { search, page, limit } = req.query;
    if (search !== undefined && (typeof search !== 'string' || search.length > BUSCA_MAXIMA)) {
      throw new ValidationError(`search deve ser um texto de até ${BUSCA_MAXIMA} caracteres`);
    }
    if (page !== undefined && limit === undefined) {
      throw new ValidationError('limit é obrigatório para usar page');
    }

    const resultado = await this.listGuests.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      confirmed: confirmed === undefined ? undefined : FILTROS[confirmed],
      search: search?.trim(),
      page: page === undefined ? 1 : numeroInteiro(page, 'page'),
      limit: limit === undefined ? undefined : numeroInteiro(limit, 'limit', LIMITE_MAXIMO),
    });

    res.set('Cache-Control', 'no-store');
    res.set({
      'X-Total-Count': String(resultado.total),
      'X-Page': String(resultado.page),
      'X-Total-Pages': String(resultado.totalPages),
    });
    res.json(resultado.guests.map(paraResposta));
  };

  update = async (req, res) => {
    const guest = await this.updateGuest.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      guestId: req.params.guestId,
      dados: req.body || {},
    });

    res.set('Cache-Control', 'no-store');
    res.json(paraResposta(guest));
  };

  remove = async (req, res) => {
    await this.deleteGuest.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      guestId: req.params.guestId,
    });

    res.status(204).end();
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
