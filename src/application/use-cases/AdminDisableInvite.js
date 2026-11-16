const { NotFoundError } = require('../../domain/errors');
const { ACOES } = require('../../domain/entities/AuditLog');
const { recordAudit } = require('./recordAudit');

class AdminDisableInvite {
  constructor({ eventRepository, auditLogRepository }) {
    this.eventRepository = eventRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ eventId, admin }) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw new NotFoundError('Evento não encontrado');

    if (event.slug) await this.eventRepository.update(eventId, { slug: null });

    await recordAudit(this.auditLogRepository, {
      action: ACOES.DESATIVAR_CONVITE,
      admin,
      targetType: 'event',
      targetId: eventId,
    });
  }
}

module.exports = { AdminDisableInvite };
