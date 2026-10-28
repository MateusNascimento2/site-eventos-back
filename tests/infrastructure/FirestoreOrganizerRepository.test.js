const {
  FirestoreOrganizerRepository,
} = require('../../src/infrastructure/repositories/FirestoreOrganizerRepository');
const { Organizer } = require('../../src/domain/entities/Organizer');
const { FakeFirestore } = require('../helpers/FakeFirestore');

describe('FirestoreOrganizerRepository', () => {
  it('create usa o uid como id do documento', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreOrganizerRepository(db);

    await repositorio.create(new Organizer({ id: 'uid-1', name: 'Ana', email: 'ana@teste.com' }));

    expect(db.dados.organizers['uid-1']).toMatchObject({ name: 'Ana', email: 'ana@teste.com' });
    expect(db.dados.organizers['uid-1']).not.toHaveProperty('id');
  });

  it('findById devolve o organizador ou null', async () => {
    const repositorio = new FirestoreOrganizerRepository(new FakeFirestore());
    await repositorio.create(new Organizer({ id: 'uid-1', name: 'Ana', email: 'ana@teste.com' }));

    const encontrado = await repositorio.findById('uid-1');

    expect(encontrado).toBeInstanceOf(Organizer);
    expect(encontrado.name).toBe('Ana');
    expect(await repositorio.findById('nao-existe')).toBeNull();
  });
});
