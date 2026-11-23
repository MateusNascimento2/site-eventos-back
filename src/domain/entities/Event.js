const { ValidationError } = require('../errors');
const { TELEFONE_VALIDO, soDigitos } = require('../phone');
const { normalizarChavePix, textoPix } = require('../pix');
const { LAYOUTS, LAYOUT_PADRAO, layoutExiste } = require('../layouts');

const TITULO_MAXIMO = 120;
const DESCRICAO_MAXIMA = 1000;
const NOME_PIX_MAXIMO = 25;
const CIDADE_PIX_MAXIMA = 15;

function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function emBrancoVira(valor) {
  return typeof valor === 'string' ? valor.trim() || null : valor;
}

function validarTextoPix(valor, maximo, campo) {
  if (valor === null) return;
  if (typeof valor !== 'string' || valor.length > maximo) {
    throw new ValidationError(`${campo} deve ser um texto de até ${maximo} caracteres`);
  }
  if (textoPix(valor) === '') throw new ValidationError(`${campo} deve ter letras ou números`);
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
    pixName = null,
    pixCity = null,
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
    if (!layoutExiste(layout)) {
      throw new ValidationError(
        `layout inválido, use um de: ${LAYOUTS.map((item) => item.id).join(', ')}`,
      );
    }

    // Texto em branco limpa o campo
    const chave = emBrancoVira(pixKey);
    const contato = emBrancoVira(whatsapp);
    const nomePix = emBrancoVira(pixName);
    const cidadePix = emBrancoVira(pixCity);

    const chaveNormalizada =
      chave === null || typeof chave !== 'string' ? null : normalizarChavePix(chave);
    if (chave !== null && chaveNormalizada === null) {
      throw new ValidationError(
        'pixKey deve ser CPF, CNPJ, e-mail, telefone com +55 ou chave aleatória',
      );
    }
    if (
      contato !== null &&
      (typeof contato !== 'string' || !TELEFONE_VALIDO.test(soDigitos(contato)))
    ) {
      throw new ValidationError('whatsapp inválido, informe DDD e número');
    }
    validarTextoPix(nomePix, NOME_PIX_MAXIMO, 'pixName');
    validarTextoPix(cidadePix, CIDADE_PIX_MAXIMA, 'pixCity');
    if (typeof pixEnabled !== 'boolean') {
      throw new ValidationError('pixEnabled deve ser true ou false');
    }
    if (pixEnabled && [chave, contato, nomePix, cidadePix].includes(null)) {
      throw new ValidationError(
        'pixKey, whatsapp, pixName e pixCity são obrigatórios para habilitar o Pix',
      );
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
    this.pixKey = chaveNormalizada;
    this.pixEnabled = pixEnabled;
    this.pixName = nomePix;
    this.pixCity = cidadePix;
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
