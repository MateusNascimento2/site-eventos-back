const { guestKey } = require('../../src/application/use-cases/guestKey');

describe('guestKey', () => {
  it('o mesmo e-mail gera sempre a mesma chave', () => {
    expect(guestKey({ email: 'ana@teste.com' })).toBe(guestKey({ email: 'ana@teste.com' }));
  });

  it('e-mails diferentes geram chaves diferentes', () => {
    expect(guestKey({ email: 'ana@teste.com' })).not.toBe(guestKey({ email: 'bia@teste.com' }));
  });

  it('não gera barras nem caracteres perigosos para o id do documento', () => {
    expect(guestKey({ email: 'a+b@teste.com' })).toMatch(/^[a-f0-9]{64}$/);
  });
});
