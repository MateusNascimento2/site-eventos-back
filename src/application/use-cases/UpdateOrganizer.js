const { Organizer } = require('../../domain/entities/Organizer');
const { NotFoundError, ValidationError } = require('../../domain/errors');

// Só o nome muda: e-mail, bloqueio e data não são editáveis pelo próprio organizador
const CAMPOS_EDITAVEIS = ['name'];

class UpdateOrganizer {
  constructor({ organizerRepository }) {
    this.organizerRepository = organizerRepository;
  }

  async execute({ uid, dados = {} }) {
    const organizer = await this.organizerRepository.findById(uid);
    if (!organizer) throw new NotFoundError('Organizador não encontrado');

    const alteracoes = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    }
    if (Object.keys(alteracoes).length === 0) {
      throw new ValidationError('Informe ao menos um campo para atualizar');
    }

    // Reaproveita as validações da entidade
    const atualizado = new Organizer({ ...organizer, ...alteracoes });

    return this.organizerRepository.update(uid, { name: atualizado.name });
  }
}

module.exports = { UpdateOrganizer };
