const { EventRepository } = require('../../src/domain/repositories/EventRepository');
const { GuestRepository } = require('../../src/domain/repositories/GuestRepository');
const { GiftRepository } = require('../../src/domain/repositories/GiftRepository');
const { OrganizerRepository } = require('../../src/domain/repositories/OrganizerRepository');
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

const metodos = (classe) =>
  Object.getOwnPropertyNames(classe.prototype).filter((nome) => nome !== 'constructor');

describe.each([
  ['FirestoreEventRepository', EventRepository, FirestoreEventRepository],
  ['FirestoreGuestRepository', GuestRepository, FirestoreGuestRepository],
  ['FirestoreGiftRepository', GiftRepository, FirestoreGiftRepository],
  ['FirestoreOrganizerRepository', OrganizerRepository, FirestoreOrganizerRepository],
])('%s', (nome, contrato, implementacao) => {
  it('implementa todos os métodos do contrato', () => {
    const faltando = metodos(contrato).filter((metodo) => !metodos(implementacao).includes(metodo));

    expect(faltando).toEqual([]);
  });
});
