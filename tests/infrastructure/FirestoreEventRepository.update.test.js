const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const { Event } = require('../../src/domain/entities/Event');
const { FakeFirestore } = require('../helpers/FakeFirestore');

async function repositorioComEvento() {
  const db = new FakeFirestore();
  const repositorio = new FirestoreEventRepository(db);
  const criado = await repositorio.create(
    new Event({
      organizerId: 'uid-1',
      title: 'Casamento',
      date: '2026-12-01',
      location: 'Rio de Janeiro',
    }),
  );
  return { db, repositorio, criado };
}

describe('FirestoreEventRepository (update e delete)', () => {
  it('update altera só os campos informados e devolve o evento', async () => {
    const { db, repositorio, criado } = await repositorioComEvento();

    const atualizado = await repositorio.update(criado.id, { title: 'Novo título' });

    expect(atualizado).toBeInstanceOf(Event);
    expect(atualizado.title).toBe('Novo título');
    expect(atualizado.location).toBe('Rio de Janeiro');
    expect(db.dados.events[criado.id].organizerId).toBe('uid-1');
  });

  it('delete remove o documento', async () => {
    const { repositorio, criado } = await repositorioComEvento();

    await repositorio.delete(criado.id);

    expect(await repositorio.findById(criado.id)).toBeNull();
  });
});
