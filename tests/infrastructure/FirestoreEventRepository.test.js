const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const { Event } = require('../../src/domain/entities/Event');
const { FakeFirestore } = require('../helpers/FakeFirestore');

function novoEvento(extra = {}) {
  return new Event({
    organizerId: 'uid-1',
    title: 'Casamento',
    date: '2026-12-01',
    location: 'Rio de Janeiro',
    ...extra,
  });
}

describe('FirestoreEventRepository', () => {
  it('create grava o evento e devolve com o id gerado', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreEventRepository(db);

    const criado = await repositorio.create(novoEvento());

    expect(criado).toBeInstanceOf(Event);
    expect(criado.id).toBe('doc-1');
    expect(db.dados.events['doc-1']).not.toHaveProperty('id');
    expect(db.dados.events['doc-1'].title).toBe('Casamento');
  });

  it('findById devolve o evento ou null', async () => {
    const repositorio = new FirestoreEventRepository(new FakeFirestore());
    const criado = await repositorio.create(novoEvento());

    const encontrado = await repositorio.findById(criado.id);

    expect(encontrado).toBeInstanceOf(Event);
    expect(encontrado.title).toBe('Casamento');
    expect(await repositorio.findById('nao-existe')).toBeNull();
  });

  it('findByOrganizer devolve só os eventos do organizador, ordenados por data', async () => {
    const repositorio = new FirestoreEventRepository(new FakeFirestore());
    await repositorio.create(novoEvento({ title: 'Segundo', date: '2026-12-20' }));
    await repositorio.create(novoEvento({ title: 'Primeiro', date: '2026-11-05' }));
    await repositorio.create(novoEvento({ organizerId: 'uid-2', title: 'De outro' }));

    const lista = await repositorio.findByOrganizer('uid-1');

    expect(lista.map((evento) => evento.title)).toEqual(['Primeiro', 'Segundo']);
    expect(await repositorio.findByOrganizer('sem-eventos')).toEqual([]);
  });
});
