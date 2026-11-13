const { Event } = require('../../src/domain/entities/Event');
const { ValidationError } = require('../../src/domain/errors');

const base = { organizerId: 'uid-1', title: 'Casamento', date: '2026-12-01', location: 'Rio' };

describe('Event (Pix e WhatsApp)', () => {
  it('começa sem Pix, sem WhatsApp e desabilitado', () => {
    const evento = new Event(base);

    expect(evento.pixKey).toBeNull();
    expect(evento.whatsapp).toBeNull();
    expect(evento.pixEnabled).toBe(false);
  });

  it('normaliza a chave e o WhatsApp', () => {
    const evento = new Event({
      ...base,
      pixKey: '  casal@email.com ',
      whatsapp: '+55 (21) 98765-4321',
      pixEnabled: true,
    });

    expect(evento.pixKey).toBe('casal@email.com');
    expect(evento.whatsapp).toBe('21987654321');
  });

  it('texto em branco limpa a chave e o WhatsApp', () => {
    const evento = new Event({ ...base, pixKey: '   ', whatsapp: '' });

    expect(evento.pixKey).toBeNull();
    expect(evento.whatsapp).toBeNull();
  });

  it('rejeita chave longa ou que não é texto', () => {
    for (const pixKey of ['a'.repeat(141), 123, {}]) {
      expect(() => new Event({ ...base, pixKey })).toThrow(ValidationError);
    }
  });

  it('rejeita WhatsApp inválido', () => {
    for (const whatsapp of ['12345', 'abc', '0987654321', 123]) {
      expect(() => new Event({ ...base, whatsapp })).toThrow(ValidationError);
    }
  });

  it('rejeita pixEnabled que não é booleano', () => {
    expect(() => new Event({ ...base, pixEnabled: 'sim' })).toThrow(ValidationError);
  });

  it('só habilita o Pix com chave e WhatsApp', () => {
    const ativar = (extra) => () => new Event({ ...base, pixEnabled: true, ...extra });

    expect(ativar({})).toThrow(ValidationError);
    expect(ativar({ pixKey: 'chave' })).toThrow(ValidationError);
    expect(ativar({ whatsapp: '21987654321' })).toThrow(ValidationError);
    expect(ativar({ pixKey: 'chave', whatsapp: '21987654321' })).not.toThrow();
  });
});
