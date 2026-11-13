class PublicInviteController {
  constructor({ getPublicInvite, getPublicGifts, createRsvp }) {
    this.getPublicInvite = getPublicInvite;
    this.getPublicGifts = getPublicGifts;
    this.createRsvp = createRsvp;
  }

  get = async (req, res) => {
    const invite = await this.getPublicInvite.execute({ slug: req.params.slug });

    // Sem cache, para o link desativado ou trocado parar de funcionar na hora
    res.set('Cache-Control', 'no-store');
    res.json(invite);
  };

  gifts = async (req, res) => {
    const resultado = await this.getPublicGifts.execute({ slug: req.params.slug });

    // Sem cache, para o Pix desabilitado sumir na hora
    res.set('Cache-Control', 'no-store');
    res.json(resultado);
  };

  rsvp = async (req, res) => {
    const { name, email, phone, confirmed, plusOne } = req.body || {};

    const resultado = await this.createRsvp.execute({
      slug: req.params.slug,
      name,
      email,
      phone,
      confirmed,
      plusOne,
    });

    res.set('Cache-Control', 'no-store');
    res.status(201).json(resultado);
  };
}

module.exports = { PublicInviteController };
