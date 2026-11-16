const { AuditLog } = require('../../domain/entities/AuditLog');
const { AuditLogRepository } = require('../../domain/repositories/AuditLogRepository');

const COLECAO = 'auditLogs';

class FirestoreAuditLogRepository extends AuditLogRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async create(log) {
    const ref = this.db.collection(COLECAO).doc();
    await ref.set(log.toPlain());
    return new AuditLog({ ...log, id: ref.id });
  }

  async findRecent(limite) {
    const snapshot = await this.db
      .collection(COLECAO)
      .orderBy('createdAt', 'desc')
      .limit(limite)
      .get();

    return snapshot.docs.map((doc) => new AuditLog({ id: doc.id, ...doc.data() }));
  }
}

module.exports = { FirestoreAuditLogRepository };
