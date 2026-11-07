const {
  FirestoreGuestRepository,
} = require('../../src/infrastructure/repositories/FirestoreGuestRepository');
const {
  FirestoreEventRepository,
} = require('../../src/infrastructure/repositories/FirestoreEventRepository');
const { Guest } = require('../../src/domain/entities/Guest');
const { Event } = require('../../src/domain/entities/Event');
const { ConflictError } = require('../../src/domain/errors');
const { FakeFirestore } = require('../helpers/FakeFirestore');

const convidado = (extra = {}) =>
  new Guest({
    id: 'ana-souza',
    name: 'Ana Souza',
    email: 'ana@teste.com',
    phone: '21987654321',
    confirmed: true,
    ...extra,
  });

describe('FirestoreGuestRepository', () => {
  it('add grava na subcoleção guests do evento, sem o campo id', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreGuestRepository(db);

    const salvo = await repositorio.add('evento-1', convidado({ plusOne: true }));

    expect(salvo.id).toBe('ana-souza');
    expect(db.dados['events/evento-1/guests']['ana-souza']).toMatchObject({
      name: 'Ana Souza',
      confirmed: true,
      plusOne: true,
    });
    expect(db.dados['events/evento-1/guests']['ana-souza']).not.toHaveProperty('id');
  });

  it('add lança ConflictError quando o id já existe no mesmo evento', async () => {
    const repositorio = new FirestoreGuestRepository(new FakeFirestore());
    await repositorio.add('evento-1', convidado());

    await expect(repositorio.add('evento-1', convidado({ confirmed: false }))).rejects.toThrow(
      ConflictError,
    );
  });

  it('add repassa outros erros do Firestore', async () => {
    const db = new FakeFirestore();
    const repositorio = new FirestoreGuestRepository(db);
    jest.spyOn(repositorio, 'guests').mockReturnValue({
      doc: () => ({
        create: async () => {
          throw Object.assign(new Error('falha de rede'), { code: 14 });
        },
      }),
    });

    await expect(repositorio.add('evento-1', convidado())).rejects.toThrow('falha de rede');
  });

  it('o mesmo id em eventos diferentes não conflita', async () => {
    const repositorio = new FirestoreGuestRepository(new FakeFirestore());
    await repositorio.add('evento-1', convidado());

    await expect(repositorio.add('evento-2', convidado())).resolves.toBeDefined();
  });

  it('listByEvent devolve só os convidados do evento, do mais antigo ao mais novo', async () => {
    const repositorio = new FirestoreGuestRepository(new FakeFirestore());
    await repositorio.add(
      'evento-1',
      convidado({ id: 'segundo', name: 'Segundo', createdAt: '2026-11-06T12:00:00.000Z' }),
    );
    await repositorio.add(
      'evento-1',
      convidado({ id: 'primeiro', name: 'Primeiro', createdAt: '2026-11-06T10:00:00.000Z' }),
    );
    await repositorio.add('evento-2', convidado({ id: 'de-outro', name: 'De Outro' }));

    const lista = await repositorio.listByEvent('evento-1');

    expect(lista.map((g) => g.name)).toEqual(['Primeiro', 'Segundo']);
    expect(lista[0]).toBeInstanceOf(Guest);
    expect(await repositorio.listByEvent('sem-convidados')).toEqual([]);
  });

  it('remover o evento apaga também os convidados dele', async () => {
    const db = new FakeFirestore();
    const eventos = new FirestoreEventRepository(db);
    const convidados = new FirestoreGuestRepository(db);
    const criado = await eventos.create(
      new Event({ organizerId: 'uid-1', title: 'Casamento', date: '2026-12-01', location: 'Rio' }),
    );
    await convidados.add(criado.id, convidado());

    await eventos.delete(criado.id);

    expect(await eventos.findById(criado.id)).toBeNull();
    expect(await convidados.listByEvent(criado.id)).toEqual([]);
  });
});
