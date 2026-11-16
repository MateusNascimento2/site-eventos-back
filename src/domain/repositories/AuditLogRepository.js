class AuditLogRepository {
  // create(log) -> AuditLog com id
  async create() {
    console.log('create');
  }

  // findRecent(limite) -> AuditLog[] do mais novo para o mais antigo
  async findRecent() {
    console.log('findRecent');
  }
}

module.exports = { AuditLogRepository };
