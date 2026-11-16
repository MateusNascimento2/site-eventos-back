function organizadorParaResposta(organizer) {
  return { id: organizer.id, ...organizer.toPlain() };
}

function eventoParaResposta(event) {
  return {
    id: event.id,
    organizerId: event.organizerId,
    title: event.title,
    date: event.date,
    location: event.location,
    layout: event.layout,
    slug: event.slug,
    pixEnabled: event.pixEnabled,
    createdAt: event.createdAt,
  };
}

class AdminController {
  constructor({
    listAllOrganizers,
    listAllEvents,
    getAdminSummary,
    setOrganizerDisabled,
    adminDisableInvite,
    adminDeleteEvent,
    listAuditLogs,
  }) {
    this.listAllOrganizers = listAllOrganizers;
    this.listAllEvents = listAllEvents;
    this.getAdminSummary = getAdminSummary;
    this.setOrganizerDisabled = setOrganizerDisabled;
    this.adminDisableInvite = adminDisableInvite;
    this.adminDeleteEvent = adminDeleteEvent;
    this.listAuditLogs = listAuditLogs;
  }

  organizers = async (req, res) => {
    const organizers = await this.listAllOrganizers.execute();
    res.set('Cache-Control', 'no-store');
    res.json(organizers.map(organizadorParaResposta));
  };

  events = async (req, res) => {
    const events = await this.listAllEvents.execute();
    res.set('Cache-Control', 'no-store');
    res.json(events.map(eventoParaResposta));
  };

  summary = async (req, res) => {
    const resumo = await this.getAdminSummary.execute();
    res.set('Cache-Control', 'no-store');
    res.json(resumo);
  };

  disableOrganizer = (req, res) => this.mudarOrganizador(req, res, true);

  enableOrganizer = (req, res) => this.mudarOrganizador(req, res, false);

  mudarOrganizador = async (req, res, disabled) => {
    const organizer = await this.setOrganizerDisabled.execute({
      organizerId: req.params.id,
      disabled,
      admin: req.user,
    });
    res.json(organizadorParaResposta(organizer));
  };

  disableInvite = async (req, res) => {
    await this.adminDisableInvite.execute({ eventId: req.params.id, admin: req.user });
    res.status(204).end();
  };

  removeEvent = async (req, res) => {
    await this.adminDeleteEvent.execute({ eventId: req.params.id, admin: req.user });
    res.status(204).end();
  };

  auditLogs = async (req, res) => {
    const logs = await this.listAuditLogs.execute();
    res.set('Cache-Control', 'no-store');
    res.json(logs.map((log) => ({ id: log.id, ...log.toPlain() })));
  };
}

module.exports = { AdminController };
