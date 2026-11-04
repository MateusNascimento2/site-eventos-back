const TENTATIVAS = 5;

// Gera um slug que ainda não pertence a nenhum evento
async function uniqueSlug({ eventRepository, generateSlug }) {
  for (let i = 0; i < TENTATIVAS; i++) {
    const slug = generateSlug();
    if (!(await eventRepository.findBySlug(slug))) return slug;
  }
  throw new Error('Não foi possível gerar um slug único');
}

module.exports = { uniqueSlug };
