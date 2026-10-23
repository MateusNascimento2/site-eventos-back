const { ValidationError } = require('../errors');

const NOME_MAXIMO = 120;
const DESCRICAO_MAXIMA = 300;

class Gift {
  constructor({ id = null, name, description = '', createdAt = new Date().toISOString() }) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('name é obrigatório');
    if (name.trim().length > NOME_MAXIMO) {
      throw new ValidationError(`name deve ter no máximo ${NOME_MAXIMO} caracteres`);
    }
    if (typeof description !== 'string' || description.length > DESCRICAO_MAXIMA) {
      throw new ValidationError(`description deve ter no máximo ${DESCRICAO_MAXIMA} caracteres`);
    }

    this.id = id;
    this.name = name.trim();
    this.description = description;
    this.createdAt = createdAt;
  }

  toPlain() {
    const dados = { ...this };
    delete dados.id;
    return dados;
  }
}

module.exports = { Gift };
