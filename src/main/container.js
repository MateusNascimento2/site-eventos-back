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
const { UpdateEventPix } = require('../application/use-cases/UpdateEventPix');
const { GetPublicGifts } = require('../application/use-cases/GetPublicGifts');
const { CreateGift } = require('../application/use-cases/CreateGift');
const { ListGifts } = require('../application/use-cases/ListGifts');
const { UpdateGift } = require('../application/use-cases/UpdateGift');
const { DeleteGift } = require('../application/use-cases/DeleteGift');
const { ListGuests } = require('../application/use-cases/ListGuests');
const { GetEventSummary } = require('../application/use-cases/GetEventSummary');
const { CreateOrganizer } = require('../application/use-cases/CreateOrganizer');
const { GetOrganizer } = require('../application/use-cases/GetOrganizer');
const { ListAllOrganizers } = require('../application/use-cases/ListAllOrganizers');
const { ListAllEvents } = require('../application/use-cases/ListAllEvents');
const { GetAdminSummary } = require('../application/use-cases/GetAdminSummary');
const { SetOrganizerDisabled } = require('../application/use-cases/SetOrganizerDisabled');
const { AdminDisableInvite } = require('../application/use-cases/AdminDisableInvite');
const { AdminDeleteEvent } = require('../application/use-cases/AdminDeleteEvent');
const { ListAuditLogs } = require('../application/use-cases/ListAuditLogs');
const {
  FirestoreEventRepository,
} = require('../infrastructure/repositories/FirestoreEventRepository');
const {
  FirestoreGuestRepository,
} = require('../infrastructure/repositories/FirestoreGuestRepository');
const {
  FirestoreGiftRepository,
} = require('../infrastructure/repositories/FirestoreGiftRepository');
const {
  FirestoreOrganizerRepository,
} = require('../infrastructure/repositories/FirestoreOrganizerRepository');
const {
  FirestoreAuditLogRepository,
} = require('../infrastructure/repositories/FirestoreAuditLogRepository');
const {
  setUserDisabled: firebaseSetUserDisabled,
} = require('../infrastructure/firebase/userAccess');
const { generateSlug: cryptoGenerateSlug } = require('../infrastructure/security/generateSlug');
const { verifyToken: firebaseVerifyToken } = require('../infrastructure/firebase/tokenVerifier');
const { EventController } = require('../presentation/http/controllers/EventController');
const { InviteController } = require('../presentation/http/controllers/InviteController');
const {
  PublicInviteController,
} = require('../presentation/http/controllers/PublicInviteController');
const { GiftController } = require('../presentation/http/controllers/GiftController');
const { GuestController } = require('../presentation/http/controllers/GuestController');
const { OrganizerController } = require('../presentation/http/controllers/OrganizerController');
const { AdminController } = require('../presentation/http/controllers/AdminController');
const { createAuthenticate } = require('../presentation/http/middlewares/authenticate');
const { requireAdmin } = require('../presentation/http/middlewares/requireAdmin');

// Só carrega o Firebase no primeiro uso, para a API subir mesmo com o .env errado
const lazyDb = {
  collection: (nome) => require('../infrastructure/firebase/firebase').db.collection(nome),
  recursiveDelete: (ref) => require('../infrastructure/firebase/firebase').db.recursiveDelete(ref),
};

function buildContainer({
  eventRepository = new FirestoreEventRepository(lazyDb),
  organizerRepository = new FirestoreOrganizerRepository(lazyDb),
  guestRepository = new FirestoreGuestRepository(lazyDb),
  giftRepository = new FirestoreGiftRepository(lazyDb),
  auditLogRepository = new FirestoreAuditLogRepository(lazyDb),
  setUserDisabled = firebaseSetUserDisabled,
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
    updateEventPix: new UpdateEventPix({ eventRepository, getEvent }),
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
    getPublicGifts: new GetPublicGifts({ eventRepository, giftRepository }),
    createRsvp: new CreateRsvp({ eventRepository, guestRepository }),
  });

  const guestController = new GuestController({
    listGuests: new ListGuests({ guestRepository, getEvent }),
    getEventSummary: new GetEventSummary({ guestRepository, getEvent }),
  });

  const giftController = new GiftController({
    createGift: new CreateGift({ giftRepository, getEvent }),
    listGifts: new ListGifts({ giftRepository, getEvent }),
    updateGift: new UpdateGift({ giftRepository, getEvent }),
    deleteGift: new DeleteGift({ giftRepository, getEvent }),
  });

  const organizerController = new OrganizerController({
    createOrganizer: new CreateOrganizer({ organizerRepository }),
    getOrganizer: new GetOrganizer({ organizerRepository }),
  });

  const adminController = new AdminController({
    listAllOrganizers: new ListAllOrganizers({ organizerRepository }),
    listAllEvents: new ListAllEvents({ eventRepository }),
    getAdminSummary: new GetAdminSummary({ organizerRepository, eventRepository }),
    setOrganizerDisabled: new SetOrganizerDisabled({
      organizerRepository,
      auditLogRepository,
      setUserDisabled,
    }),
    adminDisableInvite: new AdminDisableInvite({ eventRepository, auditLogRepository }),
    adminDeleteEvent: new AdminDeleteEvent({ eventRepository, auditLogRepository }),
    listAuditLogs: new ListAuditLogs({ auditLogRepository }),
  });

  return {
    eventController,
    inviteController,
    publicInviteController,
    guestController,
    giftController,
    organizerController,
    adminController,
    authenticate: createAuthenticate({ verifyToken }),
    requireAdmin,
  };
}

module.exports = { buildContainer };
