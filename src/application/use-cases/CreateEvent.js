const { Event } = require('../../domain/entities/Event');

class CreateEvent {
  constructor({ eventRepository }) {
    this.eventRepository = eventRepository;
  }

  async execute({ organizerId, title, date, location, description, layout }) {
    const event = new Event({ organizerId, title, date, location, description, layout });
    return this.eventRepository.create(event);
  }
}

module.exports = { CreateEvent };
