const { EventRepository } = require('../../src/domain/repositories/EventRepository');
const { GuestRepository } = require('../../src/domain/repositories/GuestRepository');
const { GiftRepository } = require('../../src/domain/repositories/GiftRepository');
const { OrganizerRepository } = require('../../src/domain/repositories/OrganizerRepository');
const { AuditLogRepository } = require('../../src/domain/repositories/AuditLogRepository');
const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const {
  FirestoreGuestRepository,
} = require('../../src/infrastructure/repositories/FirestoreGuestRepository');
const {
  FirestoreGiftRepository,
} = require('../../src/infrastructure/repositories/FirestoreGiftRepository');
const {
  FirestoreOrganizerRepository,
} = require('../../src/infrastructure/repositories/FirestoreOrganizerRepository');

const {
  FirestoreAuditLogRepository,
} = require('../../src/infrastructure/repositories/FirestoreAuditLogRepository');

const metodos = (classe) =>
  Object.getOwnPropertyNames(classe.prototype).filter((nome) => nome !== 'constructor');

describe.each([
  ['FirestoreEventRepository', EventRepository, FirestoreEventRepository],
  ['FirestoreGuestRepository', GuestRepository, FirestoreGuestRepository],
  ['FirestoreGiftRepository', GiftRepository, FirestoreGiftRepository],
  ['FirestoreOrganizerRepository', OrganizerRepository, FirestoreOrganizerRepository],
  ['FirestoreAuditLogRepository', AuditLogRepository, FirestoreAuditLogRepository],
])('%s', (nome, contrato, implementacao) => {
  it('implementa todos os métodos do contrato', () => {
    const faltando = metodos(contrato).filter((metodo) => !metodos(implementacao).includes(metodo));

    expect(faltando).toEqual([]);
  });

  it('todo método do contrato lança erro se não for implementado', async () => {
    const instancia = new contrato();

    for (const metodo of metodos(contrato)) {
      await expect(instancia[metodo]()).rejects.toThrow(`${contrato.name}.${metodo}`);
    }
  });
});
