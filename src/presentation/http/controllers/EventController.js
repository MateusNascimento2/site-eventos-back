function paraResposta(event) {
  return { id: event.id, ...event.toPlain() };
}

class EventController {
  constructor({ createEvent, listEvents, getEvent }) {
    this.createEvent = createEvent;
    this.listEvents = listEvents;
    this.getEvent = getEvent;
  }

  create = async (req, res) => {
    const { title, date, location, description, layout } = req.body || {};

    const event = await this.createEvent.execute({
      organizerId: req.user.uid,
      title,
      date,
      location,
      description,
      layout,
    });

    res.status(201).json(paraResposta(event));
  };

  list = async (req, res) => {
    const events = await this.listEvents.execute({ organizerId: req.user.uid });
    res.json(events.map(paraResposta));
  };

  getById = async (req, res) => {
    const event = await this.getEvent.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
    });
    res.json(paraResposta(event));
  };
}

module.exports = { EventController };
