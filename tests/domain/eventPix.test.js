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
      pixName: 'Maria',
      pixCity: 'Rio',
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
    for (const pixKey of ['a'.repeat(141), 123, {}, 'chave', '21987654321']) {
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

  it('só habilita o Pix com chave, WhatsApp, nome e cidade', () => {
    const ativar = (extra) => () => new Event({ ...base, pixEnabled: true, ...extra });
    const completo = {
      pixKey: 'casal@email.com',
      whatsapp: '21987654321',
      pixName: 'Maria Silva',
      pixCity: 'Rio de Janeiro',
    };

    expect(ativar({})).toThrow(ValidationError);
    for (const campo of Object.keys(completo)) {
      const faltando = { ...completo, [campo]: null };
      expect(ativar(faltando)).toThrow(ValidationError);
    }
    expect(ativar(completo)).not.toThrow();
  });

  it('valida o nome e a cidade do recebedor', () => {
    for (const extra of [
      { pixName: 'a'.repeat(26) },
      { pixCity: 'a'.repeat(16) },
      { pixName: '!!!' },
      { pixCity: 123 },
    ]) {
      expect(() => new Event({ ...base, ...extra })).toThrow(ValidationError);
    }
    const evento = new Event({ ...base, pixName: ' Maria  ', pixCity: '' });
    expect(evento.pixName).toBe('Maria');
    expect(evento.pixCity).toBeNull();
  });

  it('aceita CPF, CNPJ, e-mail, telefone com +55 e chave aleatória', () => {
    const chaves = [
      ['529.982.247-25', '52998224725'],
      ['11.222.333/0001-81', '11222333000181'],
      ['+5521987654321', '+5521987654321'],
      ['123e4567-e12b-12d1-a456-426655440000', '123e4567-e12b-12d1-a456-426655440000'],
    ];
    for (const [entrada, esperado] of chaves) {
      expect(new Event({ ...base, pixKey: entrada }).pixKey).toBe(esperado);
    }
  });
});
