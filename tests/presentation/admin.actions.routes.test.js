const request = require('supertest');
const { createApp } = require('../../src/main/app');
const { buildContainer } = require('../../src/main/container');
const { Organizer } = require('../../src/domain/entities/Organizer');
const { NotFoundError } = require('../../src/domain/errors');
const { InMemoryEventRepository } = require('../helpers/InMemoryEventRepository');
const { InMemoryOrganizerRepository } = require('../helpers/InMemoryOrganizerRepository');
const { InMemoryAuditLogRepository } = require('../helpers/InMemoryAuditLogRepository');

const usuarios = {
  'token-admin': { uid: 'uid-admin', email: 'admin@teste.com', admin: true },
  'token-a': { uid: 'uid-a', email: 'a@teste.com' },
};

const verifyToken = async (token) => {
  if (!usuarios[token]) throw new Error('token ruim');
  return usuarios[token];
};

const comToken = (req, token = 'token-admin') => req.set('Authorization', `Bearer ${token}`);

async function criarApp({ falhaNoAuth = false } = {}) {
  const eventRepository = new InMemoryEventRepository();
  const organizerRepository = new InMemoryOrganizerRepository();
  const auditLogRepository = new InMemoryAuditLogRepository();
  const chamadasAuth = [];
  const setUserDisabled = async (uid, disabled) => {
    if (falhaNoAuth) throw new NotFoundError('Usuário não encontrado no Firebase Auth');
    chamadasAuth.push([uid, disabled]);
  };

  const app = createApp({
    checkDatabase: async () => {},
    container: buildContainer({
      eventRepository,
      organizerRepository,
      auditLogRepository,
      setUserDisabled,
      verifyToken,
    }),
  });

  await organizerRepository.create(
    new Organizer({ id: 'uid-a', name: 'Ana', email: 'a@teste.com' }),
  );
  await comToken(request(app).post('/events'), 'token-a').send({
    title: 'Casamento',
    date: '2026-12-01',
    location: 'Rio',
  });
  await comToken(request(app).post('/events/evento-1/invite'), 'token-a');

  return { app, auditLogRepository, chamadasAuth, organizerRepository };
}

describe('ações do admin', () => {
  it('exigem autenticação e perfil de administrador', async () => {
    const { app } = await criarApp();
    const chamadas = [
      (r) => r.post('/admin/organizers/uid-a/disable'),
      (r) => r.post('/admin/organizers/uid-a/enable'),
      (r) => r.delete('/admin/events/evento-1/invite'),
      (r) => r.delete('/admin/events/evento-1'),
      (r) => r.get('/admin/audit-logs'),
    ];

    for (const chamar of chamadas) {
      expect((await chamar(request(app))).status).toBe(401);
      expect((await comToken(chamar(request(app)), 'token-a')).status).toBe(403);
    }
  });

  it('desativa e reativa o organizador, bloqueando o login e registrando a auditoria', async () => {
    const { app, chamadasAuth, auditLogRepository } = await criarApp();

    const desativado = await comToken(request(app).post('/admin/organizers/uid-a/disable'));
    const reativado = await comToken(request(app).post('/admin/organizers/uid-a/enable'));

    expect(desativado.status).toBe(200);
    expect(desativado.body).toMatchObject({ id: 'uid-a', disabled: true });
    expect(reativado.body).toMatchObject({ id: 'uid-a', disabled: false });
    expect(chamadasAuth).toEqual([
      ['uid-a', true],
      ['uid-a', false],
    ]);
    expect(auditLogRepository.logs.map((l) => l.action)).toEqual([
      'organizer.disable',
      'organizer.enable',
    ]);
  });

  it('não deixa o admin desativar a própria conta', async () => {
    const { app, chamadasAuth, auditLogRepository } = await criarApp();

    const res = await comToken(request(app).post('/admin/organizers/uid-admin/disable'));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Você não pode desativar a própria conta' });
    expect(chamadasAuth).toEqual([]);
    expect(auditLogRepository.logs).toEqual([]);
  });

  it('devolve 404 para organizador inexistente e não audita', async () => {
    const { app, auditLogRepository } = await criarApp();

    const res = await comToken(request(app).post('/admin/organizers/nao-existe/disable'));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Organizador não encontrado' });
    expect(auditLogRepository.logs).toEqual([]);
  });

  it('não marca como desativado nem audita quando o Auth falha', async () => {
    const { app, organizerRepository, auditLogRepository } = await criarApp({
      falhaNoAuth: true,
    });

    const res = await comToken(request(app).post('/admin/organizers/uid-a/disable'));

    expect(res.status).toBe(404);
    expect((await organizerRepository.findById('uid-a')).disabled).toBe(false);
    expect(auditLogRepository.logs).toEqual([]);
  });

  it('desativa o convite de qualquer evento, inclusive repetindo a chamada', async () => {
    const { app, auditLogRepository } = await criarApp();

    const primeira = await comToken(request(app).delete('/admin/events/evento-1/invite'));
    const segunda = await comToken(request(app).delete('/admin/events/evento-1/invite'));
    const evento = await comToken(request(app).get('/events/evento-1'), 'token-a');

    expect(primeira.status).toBe(204);
    expect(segunda.status).toBe(204);
    expect(evento.body.slug).toBeNull();
    expect(auditLogRepository.logs).toHaveLength(2);
    expect(auditLogRepository.logs[0]).toMatchObject({
      action: 'invite.disable',
      adminId: 'uid-admin',
      adminEmail: 'admin@teste.com',
      targetType: 'event',
      targetId: 'evento-1',
    });
  });

  it('remove qualquer evento e devolve 404 se não existir', async () => {
    const { app, auditLogRepository } = await criarApp();

    const removido = await comToken(request(app).delete('/admin/events/evento-1'));
    const repetido = await comToken(request(app).delete('/admin/events/evento-1'));
    const doDono = await comToken(request(app).get('/events/evento-1'), 'token-a');

    expect(removido.status).toBe(204);
    expect(repetido.status).toBe(404);
    expect(repetido.body).toEqual({ error: 'Evento não encontrado' });
    expect(doDono.status).toBe(404);
    expect(auditLogRepository.logs.map((l) => l.action)).toEqual(['event.delete']);
  });

  it('lista a auditoria do mais novo para o mais antigo, sem cache', async () => {
    const { app } = await criarApp();
    await comToken(request(app).post('/admin/organizers/uid-a/disable'));
    await comToken(request(app).delete('/admin/events/evento-1'));

    const res = await comToken(request(app).get('/admin/audit-logs'));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.map((l) => l.action)).toEqual(['event.delete', 'organizer.disable']);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      adminId: 'uid-admin',
      targetId: 'evento-1',
    });
  });
});
