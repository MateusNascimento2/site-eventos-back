const CAMINHO_CONVITE = '/convite';

class InviteController {
  constructor({ createInvite, regenerateInvite, getFrontendUrl }) {
    this.createInvite = createInvite;
    this.regenerateInvite = regenerateInvite;
    this.getFrontendUrl = getFrontendUrl;
  }

  paraResposta(event) {
    const base = (this.getFrontendUrl() || '').replace(/\/+$/, '');
    return {
      eventId: event.id,
      slug: event.slug,
      url: base ? `${base}${CAMINHO_CONVITE}/${event.slug}` : null,
    };
  }

  create = async (req, res) => {
    const { event, created } = await this.createInvite.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
    });
    res.status(created ? 201 : 200).json(this.paraResposta(event));
  };

  regenerate = async (req, res) => {
    const event = await this.regenerateInvite.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
    });
    res.json(this.paraResposta(event));
  };
}

module.exports = { InviteController };
