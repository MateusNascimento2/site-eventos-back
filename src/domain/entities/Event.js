const { ValidationError } = require('../errors');

const LAYOUT_PADRAO = 'basico';
const TITULO_MAXIMO = 120;
const DESCRICAO_MAXIMA = 1000;

function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

class Event {
  constructor({
    id = null,
    organizerId,
    title,
    date,
    location,
    description = '',
    layout = LAYOUT_PADRAO,
    slug = null,
    whatsapp = null,
    pixKey = null,
    pixEnabled = false,
    createdAt = new Date().toISOString(),
  }) {
    if (!textoValido(organizerId)) throw new ValidationError('organizerId é obrigatório');
    if (!textoValido(title)) throw new ValidationError('title é obrigatório');
    if (!dataValida(date)) throw new ValidationError('date deve estar no formato AAAA-MM-DD');
    if (!textoValido(location)) throw new ValidationError('location é obrigatório');
    if (title.trim().length > TITULO_MAXIMO) {
      throw new ValidationError(`title deve ter no máximo ${TITULO_MAXIMO} caracteres`);
    }
    if (typeof description !== 'string' || description.length > DESCRICAO_MAXIMA) {
      throw new ValidationError(`description deve ter no máximo ${DESCRICAO_MAXIMA} caracteres`);
    }
    if (!textoValido(layout)) throw new ValidationError('layout deve ser um texto');

    this.id = id;
    this.organizerId = organizerId;
    this.title = title.trim();
    this.date = date;
    this.location = location.trim();
    this.description = description;
    this.layout = layout;
    this.slug = slug;
    this.whatsapp = whatsapp;
    this.pixKey = pixKey;
    this.pixEnabled = pixEnabled;
    this.createdAt = createdAt;
  }

  // Dados que vão para o banco (o id é a chave do documento)
  toPlain() {
    const dados = { ...this };
    delete dados.id;
    return dados;
  }
}

module.exports = { Event, LAYOUT_PADRAO };
