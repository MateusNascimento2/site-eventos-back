const ACOES = {
  DESATIVAR_ORGANIZADOR: 'organizer.disable',
  REATIVAR_ORGANIZADOR: 'organizer.enable',
  DESATIVAR_CONVITE: 'invite.disable',
  REMOVER_EVENTO: 'event.delete',
};

class AuditLog {
  constructor({
    id = null,
    action,
    adminId,
    adminEmail = null,
    targetType,
    targetId,
    createdAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.action = action;
    this.adminId = adminId;
    this.adminEmail = adminEmail;
    this.targetType = targetType;
    this.targetId = targetId;
    this.createdAt = createdAt;
  }

  toPlain() {
    const dados = { ...this };
    delete dados.id;
    return dados;
  }
}

module.exports = { AuditLog, ACOES };
