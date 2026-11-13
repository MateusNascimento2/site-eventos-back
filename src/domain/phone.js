// DDD com 2 dígitos e número com 8 dígitos, ou 9 dígitos começando com 9
const TELEFONE_VALIDO = /^[1-9]\d(?:9\d{8}|\d{8})$/;

// Fica só com os dígitos e tira o 55 do país, se vier
function soDigitos(telefone) {
  const digitos = telefone.replace(/\D/g, '');
  return digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
}

module.exports = { TELEFONE_VALIDO, soDigitos };
