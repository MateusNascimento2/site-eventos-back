class AuditLogRepository {
  // create(log) -> AuditLog com id
  async create() {
    throw new Error('AuditLogRepository.create não implementado');
  }

  // findRecent(limite) -> AuditLog[] do mais novo para o mais antigo
  async findRecent() {
    throw new Error('AuditLogRepository.findRecent não implementado');
  }
}

module.exports = { AuditLogRepository };
