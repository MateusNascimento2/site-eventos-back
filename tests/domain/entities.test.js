const { Event } = require('../../src/domain/entities/Event');
const { Guest } = require('../../src/domain/entities/Guest');
const { Gift } = require('../../src/domain/entities/Gift');
const { EventRepository } = require('../../src/domain/repositories/EventRepository');
const { GuestRepository } = require('../../src/domain/repositories/GuestRepository');
const { GiftRepository } = require('../../src/domain/repositories/GiftRepository');
const { ValidationError } = require('../../src/domain/errors');

const eventoValido = {
  organizerId: 'uid-1',
  title: 'Casamento',
  date: '2026-12-01',
  location: 'Rio de Janeiro',
};

describe('Event', () => {
  it('cria um evento válido com valores padrão', () => {
    const evento = new Event(eventoValido);

    expect(evento.title).toBe('Casamento');
    expect(evento.layout).toBe('basico');
    expect(evento.pixEnabled).toBe(false);
    expect(evento.id).toBeNull();
  });

  it('toPlain não inclui o id', () => {
    const plano = new Event({ ...eventoValido, id: 'abc' }).toPlain();

    expect(plano).not.toHaveProperty('id');
    expect(plano.organizerId).toBe('uid-1');
  });

  it('rejeita título vazio', () => {
    expect(() => new Event({ ...eventoValido, title: '  ' })).toThrow(ValidationError);
  });

  it('rejeita data fora do formato e data inexistente', () => {
    expect(() => new Event({ ...eventoValido, date: '01/12/2026' })).toThrow(ValidationError);
    expect(() => new Event({ ...eventoValido, date: '2026-02-30' })).toThrow(ValidationError);
  });

  it('exige organizador e local', () => {
    expect(() => new Event({ ...eventoValido, organizerId: '' })).toThrow(ValidationError);
    expect(() => new Event({ ...eventoValido, location: '' })).toThrow(ValidationError);
  });
});

describe('Guest', () => {
  it('cria convidado confirmado com acompanhante', () => {
    const convidado = new Guest({ name: ' Ana ', confirmed: true, plusOne: true });

    expect(convidado.name).toBe('Ana');
    expect(convidado.plusOne).toBe(true);
  });

  it('toPlain tem só os campos aceitos pelas regras do Firestore', () => {
    const plano = new Guest({ name: 'Ana', confirmed: true }).toPlain();

    expect(Object.keys(plano).sort()).toEqual(['confirmed', 'createdAt', 'name', 'plusOne']);
  });

  it('rejeita acompanhante sem confirmação', () => {
    expect(() => new Guest({ name: 'Ana', confirmed: false, plusOne: true })).toThrow(
      ValidationError,
    );
  });

  it('rejeita nome vazio, nome longo e confirmed que não é booleano', () => {
    expect(() => new Guest({ name: '', confirmed: true })).toThrow(ValidationError);
    expect(() => new Guest({ name: 'a'.repeat(121), confirmed: true })).toThrow(ValidationError);
    expect(() => new Guest({ name: 'Ana', confirmed: 'sim' })).toThrow(ValidationError);
  });
});

describe('Gift', () => {
  it('cria presente válido', () => {
    const presente = new Gift({ name: 'Jogo de panelas' });

    expect(presente.description).toBe('');
  });

  it('rejeita nome vazio e descrição longa', () => {
    expect(() => new Gift({ name: '' })).toThrow(ValidationError);
    expect(() => new Gift({ name: 'Panela', description: 'a'.repeat(301) })).toThrow(
      ValidationError,
    );
  });
});

describe('Contratos dos repositórios', () => {
  it('cada método apenas registra a chamada no console', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await new EventRepository().create();
    await new GuestRepository().listByEvent();
    await new GiftRepository().delete();

    expect(logSpy.mock.calls).toEqual([['create'], ['listByEvent'], ['delete']]);

    logSpy.mockRestore();
  });
});

describe('Event (limites)', () => {
  it('rejeita título e descrição muito longos', () => {
    expect(() => new Event({ ...eventoValido, title: 'a'.repeat(121) })).toThrow(ValidationError);
    expect(() => new Event({ ...eventoValido, description: 'a'.repeat(1001) })).toThrow(
      ValidationError,
    );
  });

  it('rejeita descrição e layout que não são texto', () => {
    expect(() => new Event({ ...eventoValido, description: 123 })).toThrow(ValidationError);
    expect(() => new Event({ ...eventoValido, layout: { x: 1 } })).toThrow(ValidationError);
  });
});
