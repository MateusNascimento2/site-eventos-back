const { AuditLog } = require('../../src/domain/entities/AuditLog');
const { AuditLogRepository } = require('../../src/domain/repositories/AuditLogRepository');

// Repositório falso, só para os testes
class InMemoryAuditLogRepository extends AuditLogRepository {
  constructor() {
    super();
    this.logs = [];
  }

  async create(log) {
    const salvo = new AuditLog({ ...log, id: `log-${this.logs.length + 1}` });
    this.logs.push(salvo);
    return salvo;
  }

  async findRecent(limite) {
    return [...this.logs].reverse().slice(0, limite);
  }
}

module.exports = { InMemoryAuditLogRepository };
