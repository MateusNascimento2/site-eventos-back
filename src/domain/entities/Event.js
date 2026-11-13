const { ValidationError } = require('../errors');
const { TELEFONE_VALIDO, soDigitos } = require('../phone');

const LAYOUT_PADRAO = 'basico';
const TITULO_MAXIMO = 120;
const DESCRICAO_MAXIMA = 1000;
const PIX_MAXIMO = 140;

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

    // Texto em branco limpa o campo
    const chave = typeof pixKey === 'string' ? pixKey.trim() || null : pixKey;
    const contato = typeof whatsapp === 'string' ? whatsapp.trim() || null : whatsapp;
    if (chave !== null && (typeof chave !== 'string' || chave.length > PIX_MAXIMO)) {
      throw new ValidationError(`pixKey deve ser um texto de até ${PIX_MAXIMO} caracteres`);
    }
    if (
      contato !== null &&
      (typeof contato !== 'string' || !TELEFONE_VALIDO.test(soDigitos(contato)))
    ) {
      throw new ValidationError('whatsapp inválido, informe DDD e número');
    }
    if (typeof pixEnabled !== 'boolean') {
      throw new ValidationError('pixEnabled deve ser true ou false');
    }
    if (pixEnabled && (chave === null || contato === null)) {
      throw new ValidationError('pixKey e whatsapp são obrigatórios para habilitar o Pix');
    }

    this.id = id;
    this.organizerId = organizerId;
    this.title = title.trim();
    this.date = date;
    this.location = location.trim();
    this.description = description;
    this.layout = layout;
    this.slug = slug;
    this.whatsapp = contato === null ? null : soDigitos(contato);
    this.pixKey = chave;
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
