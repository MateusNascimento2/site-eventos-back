const { AuditLog } = require('../../domain/entities/AuditLog');

function recordAudit(auditLogRepository, { action, admin, targetType, targetId }) {
  return auditLogRepository.create(
    new AuditLog({
      action,
      adminId: admin.uid,
      adminEmail: admin.email,
      targetType,
      targetId,
    }),
  );
}

module.exports = { recordAudit };
