const { ValidationError } = require('../errors');

const NOME_MAXIMO = 120;

class Organizer {
  constructor({ id, name, email, createdAt = new Date().toISOString() }) {
    if (typeof id !== 'string' || !id.trim()) throw new ValidationError('id é obrigatório');
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('name é obrigatório');
    if (name.trim().length > NOME_MAXIMO) {
      throw new ValidationError(`name deve ter no máximo ${NOME_MAXIMO} caracteres`);
    }
    if (typeof email !== 'string' || !email.trim()) {
      throw new ValidationError('email é obrigatório');
    }

    this.id = id;
    this.name = name.trim();
    this.email = email.trim();
    this.createdAt = createdAt;
  }

  toPlain() {
    const dados = { ...this };
    delete dados.id;
    return dados;
  }
}

module.exports = { Organizer };
