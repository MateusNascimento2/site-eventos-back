class PublicInviteController {
  constructor({ getPublicInvite }) {
    this.getPublicInvite = getPublicInvite;
  }

  get = async (req, res) => {
    const invite = await this.getPublicInvite.execute({ slug: req.params.slug });

    // Sem cache, para o link desativado ou trocado parar de funcionar na hora
    res.set('Cache-Control', 'no-store');
    res.json(invite);
  };
}

module.exports = { PublicInviteController };
