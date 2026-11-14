const { TELEFONE_VALIDO } = require('./phone');

const CHAVE_ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAXIMO = 77;

// Dígito verificador do CPF
function cpfValido(digitos) {
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(digitos[tamanho])) return false;
  }
  return true;
}

// Dígito verificador do CNPJ, que também aceita letras (cada caractere vale o código ASCII menos 48)
function cnpjValido(texto) {
  if (/^(.)\1{13}$/.test(texto)) return false;

  const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const tamanho of [12, 13]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += (texto.charCodeAt(i) - 48) * pesos[pesos.length - tamanho + i];
    }
    const resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== Number(texto[tamanho])) return false;
  }
  return true;
}

// Devolve a chave no formato que vai no QR code, ou null se não for CPF, CNPJ, e-mail, telefone ou chave aleatória
function normalizarChavePix(texto) {
  const valor = texto.trim();

  if (valor.includes('@')) {
    const email = valor.toLowerCase();
    return EMAIL_VALIDO.test(email) && email.length <= EMAIL_MAXIMO ? email : null;
  }

  if (CHAVE_ALEATORIA.test(valor.toLowerCase())) return valor.toLowerCase();

  // Telefone só vale com o + e o código do país
  if (valor.startsWith('+')) {
    const digitos = valor.replace(/\D/g, '');
    return digitos.startsWith('55') && TELEFONE_VALIDO.test(digitos.slice(2))
      ? `+${digitos}`
      : null;
  }

  const limpo = valor.toUpperCase().replace(/[.\-/\s]/g, '');
  if (/^\d{11}$/.test(limpo) && cpfValido(limpo)) return limpo;
  if (/^[A-Z0-9]{12}\d{2}$/.test(limpo) && cnpjValido(limpo)) return limpo;

  return null;
}

// Nome e cidade do QR code aceitam só letras sem acento, números e espaço
function textoPix(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// CRC-16/CCITT-FALSE, como pede o padrão do Pix
function crc16(texto) {
  let crc = 0xffff;
  for (const byte of Buffer.from(texto, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function campo(id, valor) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

// Pix copia e cola estático, sem valor: o convidado digita quanto quer dar
function gerarPayloadPix({ key, name, city }) {
  const semCrc =
    campo('00', '01') +
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', key)) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('58', 'BR') +
    campo('59', textoPix(name).slice(0, 25)) +
    campo('60', textoPix(city).slice(0, 15)) +
    campo('62', campo('05', '***')) +
    '6304';

  return semCrc + crc16(semCrc);
}

module.exports = { normalizarChavePix, textoPix, crc16, gerarPayloadPix };
