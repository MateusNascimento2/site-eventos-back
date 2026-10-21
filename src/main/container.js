// Raiz de composição: único lugar que conhece as implementações concretas.
// Aqui serão instanciados os repositórios (infrastructure), os casos de uso
// (application) e os controllers (presentation), ligando um ao outro.
//
// Exemplo (Fase B):
//   const eventRepository = new FirestoreEventRepository(db);
//   const createEvent = new CreateEvent(eventRepository);
//   const eventController = new EventController({ createEvent });

module.exports = {};
