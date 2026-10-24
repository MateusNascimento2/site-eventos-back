const { CreateEvent } = require('../../src/application/use-cases/CreateEvent');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { ValidationError } = require('../../src/domain/errors');

const dados = {
  organizerId: 'uid-1',
  title: 'Casamento',
  date: '2026-12-01',
  location: 'Rio de Janeiro',
};

describe('CreateEvent', () => {
  it('cria o evento e devolve com id e organizador', async () => {
    const repositorio = new InMemoryEventRepository();
    const criado = await new CreateEvent({ eventRepository: repositorio }).execute(dados);

    expect(criado.id).toBe('evento-1');
    expect(criado.organizerId).toBe('uid-1');
    expect(criado.layout).toBe('basico');
    expect(await repositorio.findById('evento-1')).toEqual(criado);
  });

  it('não salva nada quando os dados são inválidos', async () => {
    const repositorio = new InMemoryEventRepository();
    const casoDeUso = new CreateEvent({ eventRepository: repositorio });

    await expect(casoDeUso.execute({ ...dados, title: '' })).rejects.toThrow(ValidationError);
    await expect(casoDeUso.execute({ ...dados, date: '01/12/2026' })).rejects.toThrow(
      ValidationError,
    );
    expect(repositorio.events).toHaveLength(0);
  });

  it('ignora campos que não fazem parte do caso de uso', async () => {
    const repositorio = new InMemoryEventRepository();
    const criado = await new CreateEvent({ eventRepository: repositorio }).execute({
      ...dados,
      pixKey: 'chave-invasora',
      slug: 'slug-invasor',
    });

    expect(criado.pixKey).toBeNull();
    expect(criado.slug).toBeNull();
  });
});
