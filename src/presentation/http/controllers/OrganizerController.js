function paraResposta(organizer) {
  return { id: organizer.id, ...organizer.toPlain() };
}

class OrganizerController {
  constructor({ createOrganizer, getOrganizer }) {
    this.createOrganizer = createOrganizer;
    this.getOrganizer = getOrganizer;
  }

  create = async (req, res) => {
    const { name } = req.body || {};

    // uid e email vêm do token
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
}

module.exports = { OrganizerController };
