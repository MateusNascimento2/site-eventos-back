const { NotFoundError } = require('../../domain/errors');
const { ACOES } = require('../../domain/entities/AuditLog');
const { recordAudit } = require('./recordAudit');

class AdminDeleteEvent {
  constructor({ eventRepository, auditLogRepository }) {
    this.eventRepository = eventRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ eventId, admin }) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw new NotFoundError('Evento não encontrado');

    await this.eventRepository.delete(eventId);

    await recordAudit(this.auditLogRepository, {
      action: ACOES.REMOVER_EVENTO,
      admin,
      targetType: 'event',
      targetId: eventId,
    });
  }
}

module.exports = { AdminDeleteEvent };
