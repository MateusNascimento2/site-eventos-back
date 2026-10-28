// Raiz de composição: único lugar que conhece as implementações concretas.
// Aqui serão instanciados os repositórios (infrastructure), os casos de uso
// (application) e os controllers (presentation), ligando um ao outro.

const { CreateEvent } = require('../application/use-cases/CreateEvent');
const { ListEvents } = require('../application/use-cases/ListEvents');
const { GetEvent } = require('../application/use-cases/GetEvent');
const { UpdateEvent } = require('../application/use-cases/UpdateEvent');
const { DeleteEvent } = require('../application/use-cases/DeleteEvent');
const { CreateOrganizer } = require('../application/use-cases/CreateOrganizer');
const { GetOrganizer } = require('../application/use-cases/GetOrganizer');
const {
  FirestoreEventRepository,
} = require('../infrastructure/repositories/FirestoreEventRepository');
const {
  FirestoreOrganizerRepository,
} = require('../infrastructure/repositories/FirestoreOrganizerRepository');
const { verifyToken: firebaseVerifyToken } = require('../infrastructure/firebase/tokenVerifier');
const { EventController } = require('../presentation/http/controllers/EventController');
const { OrganizerController } = require('../presentation/http/controllers/OrganizerController');
const { createAuthenticate } = require('../presentation/http/middlewares/authenticate');

// Só carrega o Firebase no primeiro uso, para a API subir mesmo com o .env errado
const lazyDb = {
  collection: (nome) => require('../infrastructure/firebase/firebase').db.collection(nome),
  recursiveDelete: (ref) => require('../infrastructure/firebase/firebase').db.recursiveDelete(ref),
};

function buildContainer({
  eventRepository = new FirestoreEventRepository(lazyDb),
  organizerRepository = new FirestoreOrganizerRepository(lazyDb),
  verifyToken = firebaseVerifyToken,
} = {}) {
  const getEvent = new GetEvent({ eventRepository });

  const eventController = new EventController({
    createEvent: new CreateEvent({ eventRepository }),
    listEvents: new ListEvents({ eventRepository }),
    getEvent,
    updateEvent: new UpdateEvent({ eventRepository, getEvent }),
    deleteEvent: new DeleteEvent({ eventRepository, getEvent }),
  });

  const organizerController = new OrganizerController({
    createOrganizer: new CreateOrganizer({ organizerRepository }),
    getOrganizer: new GetOrganizer({ organizerRepository }),
  });

  return {
    eventController,
    organizerController,
    authenticate: createAuthenticate({ verifyToken }),
  };
}

module.exports = { buildContainer };
