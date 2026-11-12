function paraResposta(gift) {
  return { id: gift.id, ...gift.toPlain() };
}

class GiftController {
  constructor({ createGift, listGifts, updateGift, deleteGift }) {
    this.createGift = createGift;
    this.listGifts = listGifts;
    this.updateGift = updateGift;
    this.deleteGift = deleteGift;
  }

  create = async (req, res) => {
    const { name, description } = req.body || {};

    const gift = await this.createGift.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      name,
      description,
    });

    res.status(201).json(paraResposta(gift));
  };

  list = async (req, res) => {
    const gifts = await this.listGifts.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
    });
    res.json(gifts.map(paraResposta));
  };

  update = async (req, res) => {
    const gift = await this.updateGift.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      giftId: req.params.giftId,
      dados: req.body || {},
    });
    res.json(paraResposta(gift));
  };

  remove = async (req, res) => {
    await this.deleteGift.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      giftId: req.params.giftId,
    });
    res.status(204).end();
  };
}

module.exports = { GiftController };
