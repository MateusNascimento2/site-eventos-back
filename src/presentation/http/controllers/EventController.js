function paraResposta(event) {
  return { id: event.id, ...event.toPlain() };
}

class EventController {
  constructor({ createEvent, listEvents, getEvent, updateEvent, deleteEvent }) {
    this.createEvent = createEvent;
    this.listEvents = listEvents;
    this.getEvent = getEvent;
    this.updateEvent = updateEvent;
    this.deleteEvent = deleteEvent;
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

  update = async (req, res) => {
    const event = await this.updateEvent.execute({
      eventId: req.params.id,
      organizerId: req.user.uid,
      dados: req.body || {},
    });
    res.json(paraResposta(event));
  };

  remove = async (req, res) => {
    await this.deleteEvent.execute({ eventId: req.params.id, organizerId: req.user.uid });
    res.status(204).end();
  };
}

module.exports = { EventController };
