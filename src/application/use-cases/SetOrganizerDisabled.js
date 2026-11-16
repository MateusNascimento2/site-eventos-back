const { NotFoundError, ValidationError } = require('../../domain/errors');
const { ACOES } = require('../../domain/entities/AuditLog');
const { recordAudit } = require('./recordAudit');

class SetOrganizerDisabled {
  constructor({ organizerRepository, auditLogRepository, setUserDisabled }) {
    this.organizerRepository = organizerRepository;
    this.auditLogRepository = auditLogRepository;
    this.setUserDisabled = setUserDisabled;
  }

  async execute({ organizerId, disabled, admin }) {
    if (disabled && organizerId === admin.uid) {
      throw new ValidationError('Você não pode desativar a própria conta');
    }

    const organizer = await this.organizerRepository.findById(organizerId);
    if (!organizer) throw new NotFoundError('Organizador não encontrado');

    await this.setUserDisabled(organizerId, disabled);
    const atualizado = await this.organizerRepository.update(organizerId, { disabled });

    await recordAudit(this.auditLogRepository, {
      action: disabled ? ACOES.DESATIVAR_ORGANIZADOR : ACOES.REATIVAR_ORGANIZADOR,
      admin,
      targetType: 'organizer',
      targetId: organizerId,
    });

    return atualizado;
  }
}

module.exports = { SetOrganizerDisabled };
