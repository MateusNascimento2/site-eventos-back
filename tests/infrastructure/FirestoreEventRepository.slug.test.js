const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const { Event } = require('../../src/domain/entities/Event');
const { FakeFirestore } = require('../helpers/FakeFirestore');

async function repositorioComEvento() {
  const repositorio = new FirestoreEventRepository(new FakeFirestore());
  const criado = await repositorio.create(
    new Event({
      organizerId: 'uid-1',
      title: 'Casamento',
      date: '2026-12-01',
      location: 'Rio de Janeiro',
    }),
  );
  return { repositorio, criado };
}

describe('FirestoreEventRepository (slug)', () => {
  it('findBySlug devolve o evento que tem o slug', async () => {
    const { repositorio, criado } = await repositorioComEvento();
    await repositorio.update(criado.id, { slug: 'abc123abc123' });

    const encontrado = await repositorio.findBySlug('abc123abc123');

    expect(encontrado).toBeInstanceOf(Event);
    expect(encontrado.id).toBe(criado.id);
  });

  it('findBySlug devolve null para slug que não existe', async () => {
    const { repositorio } = await repositorioComEvento();

    expect(await repositorio.findBySlug('nao-existe-00')).toBeNull();
  });

  it('trocar o slug faz o antigo deixar de existir', async () => {
    const { repositorio, criado } = await repositorioComEvento();
    await repositorio.update(criado.id, { slug: 'antigo-000001' });

    await repositorio.update(criado.id, { slug: 'novo-0000002' });

    expect(await repositorio.findBySlug('antigo-000001')).toBeNull();
    expect((await repositorio.findBySlug('novo-0000002')).id).toBe(criado.id);
  });
});
