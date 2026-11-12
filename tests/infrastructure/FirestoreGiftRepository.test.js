const {
  FirestoreGiftRepository,
} = require('../../src/infrastructure/repositories/FirestoreGiftRepository');
const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const { Gift } = require('../../src/domain/entities/Gift');
const { Event } = require('../../src/domain/entities/Event');
const { FakeFirestore } = require('../helpers/FakeFirestore');

const presente = (extra = {}) => new Gift({ name: 'Jogo de panelas', ...extra });

describe('FirestoreGiftRepository', () => {
  it('create grava na subcoleção gifts do evento, sem o campo id, e devolve o id', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreGiftRepository(db);

    const criado = await repositorio.create('evento-1', presente({ description: 'Inox' }));

    expect(criado.id).toEqual(expect.any(String));
    expect(db.dados['events/evento-1/gifts'][criado.id]).toMatchObject({
      name: 'Jogo de panelas',
      description: 'Inox',
    });
    expect(db.dados['events/evento-1/gifts'][criado.id]).not.toHaveProperty('id');
  });

  it('findById encontra o presente do evento e devolve null quando não existe', async () => {
    const repositorio = new FirestoreGiftRepository(new FakeFirestore());
    const criado = await repositorio.create('evento-1', presente());

    const achado = await repositorio.findById('evento-1', criado.id);

    expect(achado).toBeInstanceOf(Gift);
    expect(achado.name).toBe('Jogo de panelas');
    expect(await repositorio.findById('evento-1', 'nao-existe')).toBeNull();
    expect(await repositorio.findById('evento-2', criado.id)).toBeNull();
  });

  it('listByEvent devolve só os presentes do evento, do mais antigo ao mais novo', async () => {
    const repositorio = new FirestoreGiftRepository(new FakeFirestore());
    await repositorio.create(
      'evento-1',
      presente({ name: 'Segundo', createdAt: '2026-11-12T12:00:00.000Z' }),
    );
    await repositorio.create(
      'evento-1',
      presente({ name: 'Primeiro', createdAt: '2026-11-12T10:00:00.000Z' }),
    );
    await repositorio.create('evento-2', presente({ name: 'De outro evento' }));

    const lista = await repositorio.listByEvent('evento-1');

    expect(lista.map((g) => g.name)).toEqual(['Primeiro', 'Segundo']);
    expect(await repositorio.listByEvent('sem-presentes')).toEqual([]);
  });

  it('update troca só os campos informados e devolve o presente atualizado', async () => {
    const repositorio = new FirestoreGiftRepository(new FakeFirestore());
    const criado = await repositorio.create('evento-1', presente({ description: 'Inox' }));

    const atualizado = await repositorio.update('evento-1', criado.id, { name: 'Panela' });

    expect(atualizado.name).toBe('Panela');
    expect(atualizado.description).toBe('Inox');
    expect(atualizado.createdAt).toBe(criado.createdAt);
  });

  it('delete remove só o presente indicado', async () => {
    const repositorio = new FirestoreGiftRepository(new FakeFirestore());
    const um = await repositorio.create('evento-1', presente({ name: 'Um' }));
    await repositorio.create('evento-1', presente({ name: 'Dois' }));

    await repositorio.delete('evento-1', um.id);

    expect((await repositorio.listByEvent('evento-1')).map((g) => g.name)).toEqual(['Dois']);
  });

  it('remover o evento apaga também os presentes dele', async () => {
    const db = new FakeFirestore();
    const eventos = new FirestoreEventRepository(db);
    const presentes = new FirestoreGiftRepository(db);
    const criado = await eventos.create(
      new Event({ organizerId: 'uid-1', title: 'Casamento', date: '2026-12-01', location: 'Rio' }),
    );
    await presentes.create(criado.id, presente());

    await eventos.delete(criado.id);

    expect(await presentes.listByEvent(criado.id)).toEqual([]);
  });
});
