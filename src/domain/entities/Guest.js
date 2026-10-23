const { ValidationError } = require('../errors');

const NOME_MAXIMO = 120;

class Guest {
  constructor({
    id = null,
    name,
    confirmed,
    plusOne = false,
    createdAt = new Date().toISOString(),
  }) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('name é obrigatório');
    if (name.trim().length > NOME_MAXIMO) {
      throw new ValidationError(`name deve ter no máximo ${NOME_MAXIMO} caracteres`);
    }
    if (typeof confirmed !== 'boolean')
      throw new ValidationError('confirmed deve ser true ou false');
    if (typeof plusOne !== 'boolean') throw new ValidationError('plusOne deve ser true ou false');
    if (plusOne && !confirmed) {
      throw new ValidationError('plusOne só vale para convidado confirmado');
    }

    this.id = id;
    this.name = name.trim();
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
