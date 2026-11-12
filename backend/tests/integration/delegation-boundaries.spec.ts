import { administrationHarness } from '../fixtures/admin-http';

describe('delegation time boundaries', () => {
  const harness = administrationHarness();
  it('terminates a scheduled grant on proposer lock and never revives it on unlock', async () => {
    const {
      accounts: [administrator, , proposer, recipient],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(administrator.username);
    const manager = await harness.login(proposer.username);
    const original = await harness.login(recipient.username);
    const draft = (
      await manager
        .send('/delegation-proposals', {
          seasonId: season.id,
          recipientId: recipient.id,
          actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
          startMode: 'SCHEDULED',
          startsAt: '2026-11-05T03:05:00Z',
          endsAt: '2026-11-05T03:15:00Z',
          reason: 'Kiểm thử khóa tài khoản',
        })
        .expect(201)
    ).body.data;
    const path = '/delegation-proposals/' + draft.id;
    const pending = (
      await manager
        .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
        .expect(200)
    ).body.data;
    const grant = (
      await admin
        .send(path + '/grant', { versionId: pending.versionId, expectedRevision: pending.revision })
        .expect(201)
    ).body.data;
    await original.get('/auth/session').expect(200);
    const locked = (
      await admin.send('/accounts/' + proposer.id + '/lock', { expectedRevision: '1' }).expect(200)
    ).body.data;
    await original.get('/auth/session').expect(401);
    await admin
      .send('/accounts/' + proposer.id + '/unlock', { expectedRevision: locked.revision })
      .expect(200);
    const fresh = await harness.login(recipient.username);
    harness.clock.set(new Date('2026-11-05T03:16:00Z'));
    await fresh.get('/auth/session').expect(200);
    expect(
      await harness.observer.delegationBoundary.findMany({
        where: { grantId: grant.relatedId },
        select: { boundaryKind: true },
      }),
    ).toEqual([{ boundaryKind: 'TERMINATION' }]);
    expect(
      await harness.observer.auditRecord.findFirstOrThrow({
        where: { objectId: grant.relatedId, actionCode: 'DELEGATION_TERMINATED' },
      }),
    ).toMatchObject({
      beforeData: { grantId: grant.relatedId, state: 'SCHEDULED' },
      afterData: expect.objectContaining({ state: 'TERMINATED' }),
    });
  });
  it('processes both boundaries after downtime and keeps subsequent logins valid', async () => {
    const { accounts, seasons } = await harness.fixtures();
    const [administrator, , proposer, recipient] = accounts;
    const admin = await harness.login(administrator.username);
    const manager = await harness.login(proposer.username);
    const previous = await harness.login(recipient.username);
    const draft = (
      await manager
        .send('/delegation-proposals', {
          seasonId: seasons[0].id,
          recipientId: recipient.id,
          actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
          startMode: 'SCHEDULED',
          startsAt: '2026-11-05T03:03:00Z',
          endsAt: '2026-11-05T03:05:00Z',
          reason: 'Lịch thi đấu',
        })
        .expect(201)
    ).body.data;
    const path = '/delegation-proposals/' + draft.id;
    const pending = (
      await manager
        .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
        .expect(200)
    ).body.data;
    const grant = (
      await admin
        .send(path + '/grant', { versionId: pending.versionId, expectedRevision: pending.revision })
        .expect(201)
    ).body.data;
    await previous.get('/auth/session').expect(200);
    harness.clock.set(new Date('2026-11-05T03:06:00Z'));
    await previous.get('/auth/session').expect(401);
    const fresh = await harness.login(recipient.username);
    await fresh.get('/auth/session').expect(200);
    await manager.get('/auth/session').expect(200);
    expect(
      await harness.observer.delegationBoundary.findMany({
        where: { grantId: grant.relatedId },
        orderBy: { effectiveAt: 'asc' },
        select: { boundaryKind: true },
      }),
    ).toEqual([{ boundaryKind: 'START' }, { boundaryKind: 'EXPIRY' }]);
    const history = await harness.observer.auditRecord.findMany({
      where: { objectId: grant.relatedId },
    });
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionCode: 'DELEGATION_STARTED',
          beforeData: expect.objectContaining({ state: 'SCHEDULED' }),
          afterData: expect.objectContaining({ state: 'ACTIVE' }),
        }),
        expect.objectContaining({
          actionCode: 'DELEGATION_EXPIRED',
          beforeData: expect.objectContaining({ state: 'ACTIVE' }),
          afterData: expect.objectContaining({ state: 'EXPIRED' }),
        }),
      ]),
    );
  });
});
