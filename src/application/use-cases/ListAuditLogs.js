const LIMITE = 100;

class ListAuditLogs {
  constructor({ auditLogRepository }) {
    this.auditLogRepository = auditLogRepository;
  }

  async execute() {
    return this.auditLogRepository.findRecent(LIMITE);
  }
}

module.exports = { ListAuditLogs };
