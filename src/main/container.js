// Raiz de composição: único lugar que conhece as implementações concretas.
// Aqui serão instanciados os repositórios (infrastructure), os casos de uso
// (application) e os controllers (presentation), ligando um ao outro.

const { CreateEvent } = require('../application/use-cases/CreateEvent');
const { ListEvents } = require('../application/use-cases/ListEvents');
const { GetEvent } = require('../application/use-cases/GetEvent');
const {
  FirestoreEventRepository,
} = require('../infrastructure/repositories/FirestoreEventRepository');
const { verifyToken: firebaseVerifyToken } = require('../infrastructure/firebase/tokenVerifier');
const { EventController } = require('../presentation/http/controllers/EventController');
const { createAuthenticate } = require('../presentation/http/middlewares/authenticate');

// Só carrega o Firebase no primeiro uso, para a API subir mesmo com o .env errado
const lazyDb = {
  collection: (nome) => require('../infrastructure/firebase/firebase').db.collection(nome),
};

function buildContainer({
  eventRepository = new FirestoreEventRepository(lazyDb),
  verifyToken = firebaseVerifyToken,
} = {}) {
  const eventController = new EventController({
    createEvent: new CreateEvent({ eventRepository }),
    listEvents: new ListEvents({ eventRepository }),
    getEvent: new GetEvent({ eventRepository }),
  });

  return { eventController, authenticate: createAuthenticate({ verifyToken }) };
}

module.exports = { buildContainer };
