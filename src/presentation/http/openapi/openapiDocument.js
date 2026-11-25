const { LAYOUTS } = require('../../../domain/layouts');
const { ACOES } = require('../../../domain/entities/AuditLog');
const { version } = require('../../../../package.json');

const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` });
const parametro = (nome) => ({ $ref: `#/components/parameters/${nome}` });
const lista = (schema) => ({ type: 'array', items: schema });
const texto = (extra = {}) => ({ type: 'string', ...extra });
const textoOuNulo = (extra = {}) => ({ type: 'string', nullable: true, ...extra });
const data = { type: 'string', format: 'date-time' };

const ERROS = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
  429: 'TooManyRequests',
  503: 'ServiceUnavailable',
};

function json(descricao, schema) {
  return { description: descricao, content: { 'application/json': { schema } } };
}

function corpo(schema, descricao) {
  return {
    required: true,
    description: descricao,
    content: { 'application/json': { schema: ref(schema) } },
  };
}

function operacao({
  tag,
  resumo,
  descricao,
  publica = false,
  parametros = [],
  requestBody,
  ok,
  erros = [],
}) {
  const codigosErro = publica ? erros : [401, ...erros];
  const respostas = { ...ok };
  for (const codigo of codigosErro) {
    respostas[codigo] = { $ref: `#/components/responses/${ERROS[codigo]}` };
  }

  const resultado = { tags: [tag], summary: resumo };
  if (descricao) resultado.description = descricao;
  if (!publica) resultado.security = [{ bearerAuth: [] }];
  if (parametros.length) resultado.parameters = parametros;
  if (requestBody) resultado.requestBody = requestBody;
  resultado.responses = respostas;
  return resultado;
}

const semConteudo = (descricao) => ({ 204: { description: descricao } });

const eventoPropriedades = {
  id: texto(),
  organizerId: texto({ description: 'UID do organizador dono do evento' }),
  title: texto({ maxLength: 120 }),
  date: texto({ format: 'date', example: '2026-12-20' }),
  location: texto(),
  description: texto({ maxLength: 1000 }),
  layout: texto({ enum: LAYOUTS.map((layout) => layout.id) }),
  slug: textoOuNulo({
    description: 'Identificador do convite público, nulo se não houver convite',
  }),
  whatsapp: textoOuNulo({ description: 'Somente dígitos', example: '21999998888' }),
  pixKey: textoOuNulo({ description: 'Chave Pix normalizada' }),
  pixEnabled: { type: 'boolean' },
  pixName: textoOuNulo({ maxLength: 25 }),
  pixCity: textoOuNulo({ maxLength: 15 }),
  createdAt: data,
};

const schemas = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: { error: texto({ example: 'Mensagem de erro' }) },
  },
  Layout: {
    type: 'object',
    properties: { id: texto({ example: 'basico' }), name: texto({ example: 'Básico' }) },
  },
  Event: { type: 'object', properties: eventoPropriedades },
  EventInput: {
    type: 'object',
    required: ['title', 'date', 'location'],
    properties: {
      title: eventoPropriedades.title,
      date: eventoPropriedades.date,
      location: eventoPropriedades.location,
      description: eventoPropriedades.description,
      layout: { ...eventoPropriedades.layout, default: LAYOUTS[0].id },
    },
  },
  EventUpdate: {
    type: 'object',
    minProperties: 1,
    description: 'Informe ao menos um campo',
    properties: {
      title: eventoPropriedades.title,
      date: eventoPropriedades.date,
      location: eventoPropriedades.location,
      description: eventoPropriedades.description,
      layout: eventoPropriedades.layout,
    },
  },
  PixUpdate: {
    type: 'object',
    minProperties: 1,
    description:
      'Informe ao menos um campo. Texto em branco limpa o campo. Para habilitar o Pix, pixKey, whatsapp, pixName e pixCity precisam estar preenchidos.',
    properties: {
      pixKey: textoOuNulo({
        description: 'CPF, CNPJ, e-mail, telefone com +55 ou chave aleatória',
      }),
      whatsapp: textoOuNulo({ description: 'DDD e número' }),
      pixEnabled: { type: 'boolean' },
      pixName: textoOuNulo({ maxLength: 25 }),
      pixCity: textoOuNulo({ maxLength: 15 }),
    },
  },
  Guest: {
    type: 'object',
    properties: {
      id: texto({ description: 'Hash SHA-256 do e-mail do convidado' }),
      name: texto({ maxLength: 120 }),
      email: texto({ format: 'email' }),
      phone: texto({ description: 'Somente dígitos', example: '21999998888' }),
      confirmed: { type: 'boolean' },
      plusOne: { type: 'boolean' },
      createdAt: data,
    },
  },
  GuestUpdate: {
    type: 'object',
    minProperties: 1,
    description:
      'Informe ao menos um campo. O e-mail não pode ser alterado. confirmed false zera plusOne.',
    properties: {
      name: texto({ maxLength: 120 }),
      phone: texto({ description: 'DDD e número' }),
      confirmed: { type: 'boolean' },
      plusOne: { type: 'boolean' },
    },
  },
  EventSummary: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      confirmed: { type: 'integer' },
      declined: { type: 'integer' },
      plusOnes: { type: 'integer' },
      attending: { type: 'integer', description: 'confirmed + plusOnes' },
    },
  },
  Gift: {
    type: 'object',
    properties: {
      id: texto(),
      name: texto({ maxLength: 120 }),
      description: texto({ maxLength: 300 }),
      createdAt: data,
    },
  },
  GiftInput: {
    type: 'object',
    required: ['name'],
    properties: { name: texto({ maxLength: 120 }), description: texto({ maxLength: 300 }) },
  },
  GiftUpdate: {
    type: 'object',
    minProperties: 1,
    description: 'Informe ao menos um campo',
    properties: { name: texto({ maxLength: 120 }), description: texto({ maxLength: 300 }) },
  },
  InviteLink: {
    type: 'object',
    properties: {
      eventId: texto(),
      slug: texto(),
      url: textoOuNulo({
        description: 'Link completo do convite, nulo se FRONTEND_URL não estiver configurada',
      }),
    },
  },
  Organizer: {
    type: 'object',
    properties: {
      id: texto({ description: 'UID do Firebase Auth' }),
      name: texto({ maxLength: 120 }),
      email: texto({ format: 'email' }),
      disabled: { type: 'boolean' },
      createdAt: data,
    },
  },
  OrganizerInput: {
    type: 'object',
    required: ['name'],
    properties: { name: texto({ maxLength: 120 }) },
  },
  OrganizerUpdate: {
    type: 'object',
    minProperties: 1,
    description: 'Informe ao menos um campo',
    properties: { name: texto({ maxLength: 120 }) },
  },
  PublicInvite: {
    type: 'object',
    properties: {
      slug: texto(),
      title: texto(),
      date: texto({ format: 'date' }),
      location: texto(),
      description: texto(),
      layout: texto({ enum: LAYOUTS.map((layout) => layout.id) }),
    },
  },
  PublicGifts: {
    type: 'object',
    properties: {
      gifts: lista({
        type: 'object',
        properties: { id: texto(), name: texto(), description: texto() },
      }),
      pix: {
        type: 'object',
        nullable: true,
        description: 'Nulo quando o organizador não habilitou o Pix',
        properties: {
          key: texto(),
          name: texto(),
          whatsapp: texto(),
          payload: texto({
            description: 'Pix copia e cola (BR Code). O QR Code deve ser gerado a partir dele',
          }),
        },
      },
    },
  },
  RsvpInput: {
    type: 'object',
    required: ['name', 'email', 'phone', 'confirmed'],
    properties: {
      name: texto({ maxLength: 120 }),
      email: texto({ format: 'email' }),
      phone: texto({ description: 'DDD e número' }),
      confirmed: { type: 'boolean' },
      plusOne: { type: 'boolean', default: false, description: 'Só vale se confirmed for true' },
    },
  },
  RsvpResult: {
    type: 'object',
    properties: {
      name: texto(),
      confirmed: { type: 'boolean' },
      plusOne: { type: 'boolean' },
    },
  },
  AdminSummary: {
    type: 'object',
    properties: {
      organizers: { type: 'integer' },
      events: { type: 'integer' },
      activeInvites: { type: 'integer' },
      pixEnabled: { type: 'integer' },
    },
  },
  AdminEvent: {
    type: 'object',
    properties: {
      id: texto(),
      organizerId: texto(),
      title: texto(),
      date: texto({ format: 'date' }),
      location: texto(),
      layout: texto(),
      slug: textoOuNulo(),
      pixEnabled: { type: 'boolean' },
      createdAt: data,
    },
  },
  AuditLog: {
    type: 'object',
    properties: {
      id: texto(),
      action: texto({ enum: Object.values(ACOES) }),
      adminId: texto(),
      adminEmail: textoOuNulo(),
      targetType: texto(),
      targetId: texto(),
      createdAt: data,
    },
  },
};

const respostasComuns = {
  BadRequest: json('Dados inválidos', ref('Error')),
  Unauthorized: json('Token ausente, inválido ou expirado', ref('Error')),
  Forbidden: json('Acesso negado', ref('Error')),
  NotFound: json('Não encontrado', ref('Error')),
  Conflict: json('Conflito com dados existentes', ref('Error')),
  TooManyRequests: {
    ...json('Limite de requisições excedido', ref('Error')),
    headers: {
      'Retry-After': {
        description: 'Segundos até poder tentar de novo',
        schema: { type: 'integer' },
      },
    },
  },
  ServiceUnavailable: json('Serviço indisponível', ref('Error')),
};

const parametros = {
  EventId: { name: 'id', in: 'path', required: true, description: 'ID do evento', schema: texto() },
  GuestId: {
    name: 'guestId',
    in: 'path',
    required: true,
    description: 'ID do convidado',
    schema: texto(),
  },
  GiftId: {
    name: 'giftId',
    in: 'path',
    required: true,
    description: 'ID do presente',
    schema: texto(),
  },
  OrganizerId: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'UID do organizador',
    schema: texto(),
  },
  Slug: {
    name: 'slug',
    in: 'path',
    required: true,
    description: 'Slug do convite',
    schema: texto(),
  },
};

const cabecalhosPaginacao = {
  'X-Total-Count': {
    description: 'Total de convidados depois dos filtros',
    schema: { type: 'integer' },
  },
  'X-Page': { description: 'Página retornada', schema: { type: 'integer' } },
  'X-Total-Pages': { description: 'Total de páginas', schema: { type: 'integer' } },
};

const consultaConvidados = [
  {
    name: 'confirmed',
    in: 'query',
    description: 'Filtra por confirmação',
    schema: texto({ enum: ['true', 'false'] }),
  },
  {
    name: 'search',
    in: 'query',
    description: 'Busca por nome ou e-mail, sem diferenciar maiúsculas e acentos',
    schema: texto({ maxLength: 100 }),
  },
  {
    name: 'limit',
    in: 'query',
    description: 'Itens por página. Sem limit, retorna todos',
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
  {
    name: 'page',
    in: 'query',
    description: 'Página, a partir de 1. Exige limit',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
];

const paths = {
  '/': {
    get: operacao({
      tag: 'Saúde',
      resumo: 'Status da API',
      publica: true,
      ok: {
        200: json('API no ar', {
          type: 'object',
          properties: { status: texto({ example: 'API no ar' }) },
        }),
      },
    }),
  },
  '/health/firebase': {
    get: operacao({
      tag: 'Saúde',
      resumo: 'Verifica a conexão com o Firebase',
      publica: true,
      ok: {
        200: json('Conectado', {
          type: 'object',
          properties: {
            status: texto({ example: 'ok' }),
            firebase: texto({ example: 'conectado' }),
          },
        }),
      },
      erros: [503],
    }),
  },
  '/layouts': {
    get: operacao({
      tag: 'Layouts',
      resumo: 'Lista os layouts disponíveis',
      descricao: 'Resposta com Cache-Control público de 1 hora.',
      publica: true,
      ok: { 200: json('Layouts', lista(ref('Layout'))) },
      erros: [429],
    }),
  },
  '/organizers': {
    post: operacao({
      tag: 'Organizadores',
      resumo: 'Cadastra o organizador logado',
      descricao: 'Usa o UID e o e-mail do token. Chamar uma vez após o primeiro login.',
      requestBody: corpo('OrganizerInput'),
      ok: { 201: json('Organizador criado', ref('Organizer')) },
      erros: [400, 409],
    }),
  },
  '/organizers/me': {
    get: operacao({
      tag: 'Organizadores',
      resumo: 'Dados do organizador logado',
      ok: { 200: json('Organizador', ref('Organizer')) },
      erros: [404],
    }),
    put: operacao({
      tag: 'Organizadores',
      resumo: 'Atualiza o organizador logado',
      requestBody: corpo('OrganizerUpdate'),
      ok: { 200: json('Organizador atualizado', ref('Organizer')) },
      erros: [400, 404],
    }),
  },
  '/events': {
    post: operacao({
      tag: 'Eventos',
      resumo: 'Cria um evento',
      requestBody: corpo('EventInput'),
      ok: { 201: json('Evento criado', ref('Event')) },
      erros: [400],
    }),
    get: operacao({
      tag: 'Eventos',
      resumo: 'Lista os eventos do organizador logado',
      ok: { 200: json('Eventos', lista(ref('Event'))) },
    }),
  },
  '/events/{id}': {
    get: operacao({
      tag: 'Eventos',
      resumo: 'Detalhes de um evento',
      descricao: 'Evento de outro organizador retorna 404.',
      parametros: [parametro('EventId')],
      ok: { 200: json('Evento', ref('Event')) },
      erros: [404],
    }),
    put: operacao({
      tag: 'Eventos',
      resumo: 'Atualiza um evento',
      parametros: [parametro('EventId')],
      requestBody: corpo('EventUpdate'),
      ok: { 200: json('Evento atualizado', ref('Event')) },
      erros: [400, 404],
    }),
    delete: operacao({
      tag: 'Eventos',
      resumo: 'Remove um evento',
      descricao: 'Remove também convidados e presentes do evento.',
      parametros: [parametro('EventId')],
      ok: semConteudo('Evento removido'),
      erros: [404],
    }),
  },
  '/events/{id}/pix': {
    put: operacao({
      tag: 'Pix',
      resumo: 'Configura o Pix do evento',
      parametros: [parametro('EventId')],
      requestBody: corpo('PixUpdate'),
      ok: { 200: json('Evento atualizado', ref('Event')) },
      erros: [400, 404],
    }),
  },
  '/events/{id}/summary': {
    get: operacao({
      tag: 'Convidados',
      resumo: 'Resumo de confirmações do evento',
      parametros: [parametro('EventId')],
      ok: { 200: json('Resumo', ref('EventSummary')) },
      erros: [404],
    }),
  },
  '/events/{id}/guests': {
    get: operacao({
      tag: 'Convidados',
      resumo: 'Lista os convidados do evento',
      descricao:
        'O corpo é sempre uma lista. Os dados de paginação vêm nos headers X-Total-Count, X-Page e X-Total-Pages.',
      parametros: [parametro('EventId'), ...consultaConvidados],
      ok: {
        200: {
          ...json('Convidados', lista(ref('Guest'))),
          headers: cabecalhosPaginacao,
        },
      },
      erros: [400, 404],
    }),
  },
  '/events/{id}/guests/{guestId}': {
    put: operacao({
      tag: 'Convidados',
      resumo: 'Edita um convidado',
      parametros: [parametro('EventId'), parametro('GuestId')],
      requestBody: corpo('GuestUpdate'),
      ok: { 200: json('Convidado atualizado', ref('Guest')) },
      erros: [400, 404],
    }),
    delete: operacao({
      tag: 'Convidados',
      resumo: 'Remove um convidado',
      parametros: [parametro('EventId'), parametro('GuestId')],
      ok: semConteudo('Convidado removido'),
      erros: [404],
    }),
  },
  '/events/{id}/gifts': {
    get: operacao({
      tag: 'Presentes',
      resumo: 'Lista os presentes do evento',
      parametros: [parametro('EventId')],
      ok: { 200: json('Presentes', lista(ref('Gift'))) },
      erros: [404],
    }),
    post: operacao({
      tag: 'Presentes',
      resumo: 'Cria um presente',
      parametros: [parametro('EventId')],
      requestBody: corpo('GiftInput'),
      ok: { 201: json('Presente criado', ref('Gift')) },
      erros: [400, 404],
    }),
  },
  '/events/{id}/gifts/{giftId}': {
    put: operacao({
      tag: 'Presentes',
      resumo: 'Edita um presente',
      parametros: [parametro('EventId'), parametro('GiftId')],
      requestBody: corpo('GiftUpdate'),
      ok: { 200: json('Presente atualizado', ref('Gift')) },
      erros: [400, 404],
    }),
    delete: operacao({
      tag: 'Presentes',
      resumo: 'Remove um presente',
      parametros: [parametro('EventId'), parametro('GiftId')],
      ok: semConteudo('Presente removido'),
      erros: [404],
    }),
  },
  '/events/{id}/invite': {
    post: operacao({
      tag: 'Convite',
      resumo: 'Gera o link do convite',
      descricao: 'Se o convite já existe, devolve o mesmo link com status 200.',
      parametros: [parametro('EventId')],
      ok: {
        200: json('Convite já existia', ref('InviteLink')),
        201: json('Convite criado', ref('InviteLink')),
      },
      erros: [404],
    }),
    delete: operacao({
      tag: 'Convite',
      resumo: 'Desativa o convite',
      parametros: [parametro('EventId')],
      ok: semConteudo('Convite desativado'),
      erros: [404],
    }),
  },
  '/events/{id}/invite/regenerate': {
    post: operacao({
      tag: 'Convite',
      resumo: 'Troca o link do convite',
      descricao: 'O link antigo deixa de funcionar.',
      parametros: [parametro('EventId')],
      ok: { 200: json('Novo link', ref('InviteLink')) },
      erros: [404],
    }),
  },
  '/invites/{slug}': {
    get: operacao({
      tag: 'Convite público',
      resumo: 'Dados públicos do convite',
      publica: true,
      parametros: [parametro('Slug')],
      ok: { 200: json('Convite', ref('PublicInvite')) },
      erros: [404, 429],
    }),
  },
  '/invites/{slug}/gifts': {
    get: operacao({
      tag: 'Convite público',
      resumo: 'Presentes e Pix do convite',
      publica: true,
      parametros: [parametro('Slug')],
      ok: { 200: json('Presentes e Pix', ref('PublicGifts')) },
      erros: [404, 429],
    }),
  },
  '/invites/{slug}/rsvp': {
    post: operacao({
      tag: 'Convite público',
      resumo: 'Confirma ou recusa presença',
      descricao: 'Cada e-mail responde uma vez por evento. Repetir o e-mail retorna 409.',
      publica: true,
      parametros: [parametro('Slug')],
      requestBody: corpo('RsvpInput'),
      ok: { 201: json('Resposta registrada', ref('RsvpResult')) },
      erros: [400, 404, 409, 429],
    }),
  },
  '/admin/summary': {
    get: operacao({
      tag: 'Admin',
      resumo: 'Totais da plataforma',
      ok: { 200: json('Totais', ref('AdminSummary')) },
      erros: [403],
    }),
  },
  '/admin/organizers': {
    get: operacao({
      tag: 'Admin',
      resumo: 'Lista os organizadores',
      descricao: 'Limitada a 500 itens, do mais novo para o mais antigo.',
      ok: { 200: json('Organizadores', lista(ref('Organizer'))) },
      erros: [403],
    }),
  },
  '/admin/organizers/{id}/disable': {
    post: operacao({
      tag: 'Admin',
      resumo: 'Desativa um organizador',
      descricao:
        'Bloqueia o login e revoga os tokens. Não é possível desativar a própria conta. Gera registro de auditoria.',
      parametros: [parametro('OrganizerId')],
      ok: { 200: json('Organizador desativado', ref('Organizer')) },
      erros: [400, 403, 404],
    }),
  },
  '/admin/organizers/{id}/enable': {
    post: operacao({
      tag: 'Admin',
      resumo: 'Reativa um organizador',
      descricao: 'Gera registro de auditoria.',
      parametros: [parametro('OrganizerId')],
      ok: { 200: json('Organizador reativado', ref('Organizer')) },
      erros: [403, 404],
    }),
  },
  '/admin/events': {
    get: operacao({
      tag: 'Admin',
      resumo: 'Lista os eventos de todos os organizadores',
      descricao: 'Limitada a 500 itens, do mais novo para o mais antigo.',
      ok: { 200: json('Eventos', lista(ref('AdminEvent'))) },
      erros: [403],
    }),
  },
  '/admin/events/{id}': {
    delete: operacao({
      tag: 'Admin',
      resumo: 'Remove um evento',
      descricao: 'Gera registro de auditoria.',
      parametros: [parametro('EventId')],
      ok: semConteudo('Evento removido'),
      erros: [403, 404],
    }),
  },
  '/admin/events/{id}/invite': {
    delete: operacao({
      tag: 'Admin',
      resumo: 'Desativa o convite de um evento',
      descricao: 'Gera registro de auditoria.',
      parametros: [parametro('EventId')],
      ok: semConteudo('Convite desativado'),
      erros: [403, 404],
    }),
  },
  '/admin/audit-logs': {
    get: operacao({
      tag: 'Admin',
      resumo: 'Últimas ações de administradores',
      descricao: 'Até 100 registros, do mais novo para o mais antigo.',
      ok: { 200: json('Registros', lista(ref('AuditLog'))) },
      erros: [403],
    }),
  },
};

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'API Site Eventos',
    version,
    description:
      'API do Sistema SaaS de Landing Pages para Eventos e Aniversários. As rotas protegidas exigem o ID token do Firebase Auth no header Authorization: Bearer. As rotas de /admin exigem a claim admin.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Saúde' },
    { name: 'Layouts' },
    { name: 'Organizadores' },
    { name: 'Eventos' },
    { name: 'Pix' },
    { name: 'Convidados' },
    { name: 'Presentes' },
    { name: 'Convite' },
    { name: 'Convite público' },
    { name: 'Admin' },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Firebase ID token' },
    },
    schemas,
    responses: respostasComuns,
    parameters: parametros,
  },
};

module.exports = { spec };
