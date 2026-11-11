// Raiz de composição: único lugar que conhece as implementações concretas.
// Aqui serão instanciados os repositórios (infrastructure), os casos de uso
// (application) e os controllers (presentation), ligando um ao outro.

const { CreateEvent } = require('../application/use-cases/CreateEvent');
const { ListEvents } = require('../application/use-cases/ListEvents');
const { GetEvent } = require('../application/use-cases/GetEvent');
const { UpdateEvent } = require('../application/use-cases/UpdateEvent');
const { DeleteEvent } = require('../application/use-cases/DeleteEvent');
const { CreateInvite } = require('../application/use-cases/CreateInvite');
const { RegenerateInvite } = require('../application/use-cases/RegenerateInvite');
const { DisableInvite } = require('../application/use-cases/DisableInvite');
const { GetPublicInvite } = require('../application/use-cases/GetPublicInvite');
const { CreateRsvp } = require('../application/use-cases/CreateRsvp');
const { ListGuests } = require('../application/use-cases/ListGuests');
const { GetEventSummary } = require('../application/use-cases/GetEventSummary');
const { CreateOrganizer } = require('../application/use-cases/CreateOrganizer');
const { GetOrganizer } = require('../application/use-cases/GetOrganizer');
const {
  FirestoreEventRepository,
} = require('../infrastructure/repositories/FirestoreEventRepository');
const {
  FirestoreGuestRepository,
} = require('../infrastructure/repositories/FirestoreGuestRepository');
const {
  FirestoreOrganizerRepository,
} = require('../infrastructure/repositories/FirestoreOrganizerRepository');
const { generateSlug: cryptoGenerateSlug } = require('../infrastructure/security/generateSlug');
const { verifyToken: firebaseVerifyToken } = require('../infrastructure/firebase/tokenVerifier');
const { EventController } = require('../presentation/http/controllers/EventController');
const { InviteController } = require('../presentation/http/controllers/InviteController');
const {
  PublicInviteController,
} = require('../presentation/http/controllers/PublicInviteController');
const { GuestController } = require('../presentation/http/controllers/GuestController');
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
  guestRepository = new FirestoreGuestRepository(lazyDb),
  verifyToken = firebaseVerifyToken,
  generateSlug = cryptoGenerateSlug,
  getFrontendUrl = () => process.env.FRONTEND_URL,
} = {}) {
  const getEvent = new GetEvent({ eventRepository });

  const eventController = new EventController({
    createEvent: new CreateEvent({ eventRepository }),
    listEvents: new ListEvents({ eventRepository }),
    getEvent,
    updateEvent: new UpdateEvent({ eventRepository, getEvent }),
    deleteEvent: new DeleteEvent({ eventRepository, getEvent }),
  });

  const inviteController = new InviteController({
    createInvite: new CreateInvite({ eventRepository, getEvent, generateSlug }),
    regenerateInvite: new RegenerateInvite({ eventRepository, getEvent, generateSlug }),
    disableInvite: new DisableInvite({ eventRepository, getEvent }),
    getFrontendUrl,
  });

  const publicInviteController = new PublicInviteController({
    getPublicInvite: new GetPublicInvite({ eventRepository }),
    createRsvp: new CreateRsvp({ eventRepository, guestRepository }),
  });

  const guestController = new GuestController({
    listGuests: new ListGuests({ guestRepository, getEvent }),
    getEventSummary: new GetEventSummary({ guestRepository, getEvent }),
  });

  const organizerController = new OrganizerController({
    createOrganizer: new CreateOrganizer({ organizerRepository }),
    getOrganizer: new GetOrganizer({ organizerRepository }),
  });

  return {
    eventController,
    inviteController,
    publicInviteController,
    guestController,
    organizerController,
    authenticate: createAuthenticate({ verifyToken }),
  };
}

module.exports = { buildContainer };
