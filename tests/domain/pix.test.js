const { crc16, gerarPayloadPix, normalizarChavePix, textoPix } = require('../../src/domain/pix');

describe('Pix (BR Code)', () => {
  it('calcula o CRC16 CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera o payload igual ao exemplo oficial do Banco Central', () => {
    const payload = gerarPayloadPix({
      key: '123e4567-e12b-12d1-a456-426655440000',
      name: 'Fulano de Tal',
      city: 'BRASILIA',
    });

    expect(payload).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('tira acento e corta nome e cidade no limite', () => {
    const payload = gerarPayloadPix({
      key: 'a@b.com',
      name: 'José da Conceição Albuquerque Neto',
      city: 'São José dos Campos do Sul',
    });

    expect(payload).toContain('5925Jose da Conceicao Albuque');
    expect(payload).toContain('6015Sao Jose dos Ca');
    expect(textoPix('Ação & Cia!')).toBe('Acao Cia');
  });

  it('normaliza as chaves válidas', () => {
    expect(normalizarChavePix(' Casal@Email.com ')).toBe('casal@email.com');
    expect(normalizarChavePix('529.982.247-25')).toBe('52998224725');
    expect(normalizarChavePix('11.222.333/0001-81')).toBe('11222333000181');
    expect(normalizarChavePix('+55 (21) 98765-4321')).toBe('+5521987654321');
    expect(normalizarChavePix('123E4567-E12B-12D1-A456-426655440000')).toBe(
      '123e4567-e12b-12d1-a456-426655440000',
    );
  });

  it('aceita CNPJ alfanumérico', () => {
    expect(normalizarChavePix('12.ABC.345/01DE-35')).toBe('12ABC34501DE35');
  });

  it('rejeita chaves inválidas', () => {
    for (const chave of [
      '',
      'chave',
      '111.111.111-11',
      '52998224724',
      '11222333000180',
      '21987654321',
    ]) {
      expect(normalizarChavePix(chave)).toBeNull();
    }
  });
});
