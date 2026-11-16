const { AuditLog } = require('../../src/domain/entities/AuditLog');
const {
  FirestoreAuditLogRepository,
} = require('../../src/infrastructure/repositories/FirestoreAuditLogRepository');
const { FakeFirestore } = require('../helpers/FakeFirestore');

const log = (createdAt, targetId) =>
  new AuditLog({
    action: 'event.delete',
    adminId: 'uid-admin',
    adminEmail: 'admin@teste.com',
    targetType: 'event',
    targetId,
    createdAt,
  });

describe('FirestoreAuditLogRepository', () => {
  it('salva o registro na coleção auditLogs, sem o id dentro do documento', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreAuditLogRepository(db);

    const salvo = await repositorio.create(log('2026-11-15T10:00:00.000Z', 'e1'));

    expect(salvo.id).toEqual(expect.any(String));
    expect(Object.values(db.dados.auditLogs)[0]).not.toHaveProperty('id');
  });

  it('lista os mais recentes primeiro e respeita o limite', async () => {
    const repositorio = new FirestoreAuditLogRepository(new FakeFirestore());
    await repositorio.create(log('2026-11-15T10:00:00.000Z', 'antigo'));
    await repositorio.create(log('2026-11-15T12:00:00.000Z', 'novo'));
    await repositorio.create(log('2026-11-15T11:00:00.000Z', 'meio'));

    const todos = await repositorio.findRecent(10);
    const dois = await repositorio.findRecent(2);

    expect(todos.map((l) => l.targetId)).toEqual(['novo', 'meio', 'antigo']);
    expect(dois.map((l) => l.targetId)).toEqual(['novo', 'meio']);
  });
});
