const { ValidationError } = require('../errors');
const { TELEFONE_VALIDO, soDigitos } = require('../phone');

const NOME_MAXIMO = 120;
const EMAIL_MAXIMO = 254;
const EMAIL_VALIDO = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

class Guest {
  constructor({
    id = null,
    name,
    email,
    phone,
    confirmed,
    plusOne = false,
    createdAt = new Date().toISOString(),
  }) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('name é obrigatório');
    if (name.trim().length > NOME_MAXIMO) {
      throw new ValidationError(`name deve ter no máximo ${NOME_MAXIMO} caracteres`);
    }
    if (typeof email !== 'string' || !email.trim())
      throw new ValidationError('email é obrigatório');
    if (email.trim().length > EMAIL_MAXIMO || !EMAIL_VALIDO.test(email.trim())) {
      throw new ValidationError('email inválido');
    }
    if (typeof phone !== 'string' || !phone.trim())
      throw new ValidationError('phone é obrigatório');
    if (!TELEFONE_VALIDO.test(soDigitos(phone))) {
      throw new ValidationError('phone inválido, informe DDD e número');
    }
    if (typeof confirmed !== 'boolean')
      throw new ValidationError('confirmed deve ser true ou false');
    if (typeof plusOne !== 'boolean') throw new ValidationError('plusOne deve ser true ou false');
    if (plusOne && !confirmed) {
      throw new ValidationError('plusOne só vale para convidado confirmado');
    }

    this.id = id;
    this.name = name.trim();
    this.email = email.trim().toLowerCase();
    this.phone = soDigitos(phone);
    this.confirmed = confirmed;
    this.plusOne = plusOne;
    this.createdAt = createdAt;
  }

  // Campos iguais aos permitidos nas regras do Firestore
  toPlain() {
    const dados = { ...this };
    delete dados.id;
    return dados;
  }
}

module.exports = { Guest };
