function paraResposta(organizer) {
  return { id: organizer.id, ...organizer.toPlain() };
}

class OrganizerController {
  constructor({ createOrganizer, getOrganizer, updateOrganizer }) {
    this.createOrganizer = createOrganizer;
    this.getOrganizer = getOrganizer;
    this.updateOrganizer = updateOrganizer;
  }

  create = async (req, res) => {
    const { name } = req.body || {};

    const organizer = await this.createOrganizer.execute({
      uid: req.user.uid,
      email: req.user.email,
      name,
    });

    res.status(201).json(paraResposta(organizer));
  };

  me = async (req, res) => {
    const organizer = await this.getOrganizer.execute({ uid: req.user.uid });
    res.json(paraResposta(organizer));
  };

  updateMe = async (req, res) => {
    const organizer = await this.updateOrganizer.execute({
      uid: req.user.uid,
      dados: req.body || {},
    });
    res.json(paraResposta(organizer));
  };
}

module.exports = { OrganizerController };
