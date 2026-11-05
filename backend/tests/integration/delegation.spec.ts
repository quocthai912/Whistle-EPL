import { administrationHarness } from '../fixtures/admin-http';

describe('delegation proposal and grant contract', () => {
  const harness = administrationHarness();
  it('enforces three-person grant separation even when proposer and recipient also administer accounts', async () => {
    const {
      accounts: [independent, , proposer, recipient],
      seasons: [season],
    } = await harness.fixtures();
    const administrator = await harness.login(independent.username);
    for (const person of [proposer, recipient])
      await administrator
        .send('/accounts/' + person.id + '/system-role-assignments', {
          roleCode: 'SYSTEM_ADMINISTRATOR',
          expectedRevision: '1',
        })
        .expect(201);
    const manager = await harness.login(proposer.username);
    const recipientAdmin = await harness.login(recipient.username);
    const input = {
      seasonId: season.id,
      recipientId: recipient.id,
      actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
      startMode: 'IMMEDIATE',
      endsAt: '2026-11-06T03:00:00Z',
      reason: 'Kiểm tra tách biệt người xử lý',
    };
    const draft = (await manager.send('/delegation-proposals', input).expect(201)).body.data;
    const path = '/delegation-proposals/' + draft.id;
    const pending = (
      await manager
        .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
        .expect(200)
    ).body.data;
    const intent = { versionId: pending.versionId, expectedRevision: pending.revision };
    await manager.send(path + '/grant', intent).expect(403);
    await recipientAdmin.send(path + '/grant', intent).expect(403);
    await administrator.send(path + '/grant', intent).expect(201);
    expect(
      await harness.observer.delegationGrant.count({
        where: { approvedVersionId: pending.versionId },
      }),
    ).toBe(1);
  });
  it('records only the submitted version and preserves returned content and recipient', async () => {
    const { accounts, seasons } = await harness.fixtures();
    const manager = await harness.login(accounts[2].username);
    const admin = await harness.login(accounts[0].username);
    const input = {
      seasonId: seasons[0].id,
      recipientId: accounts[3].id,
      actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
      startMode: 'IMMEDIATE',
      endsAt: '2026-11-06T03:00:00Z',
      reason: 'Điều chỉnh lịch thi đấu',
    };
    await admin.send('/delegation-proposals', input).expect(403);
    const draft = (await manager.send('/delegation-proposals', input).expect(201)).body.data;
    const path = '/delegation-proposals/' + draft.id;
    const pending = (
      await manager
        .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
        .expect(200)
    ).body.data;
    await manager
      .send(path + '/grant', { versionId: pending.versionId, expectedRevision: pending.revision })
      .expect(403);
    const returned = (
      await admin
        .send(path + '/return', {
          versionId: pending.versionId,
          expectedRevision: pending.revision,
          reason: 'Bổ sung lý do',
        })
        .expect(200)
    ).body.data;
    const successor = (
      await manager
        .send(
          path,
          {
            ...input,
            seasonId: undefined,
            reason: 'Lý do đã bổ sung',
            expectedRevision: returned.revision,
          },
          undefined,
          'patch',
        )
        .expect(200)
    ).body.data;
    expect(successor.versionId).not.toBe(draft.versionId);
    const resubmitted = (
      await manager
        .send(path + '/submit', {
          versionId: successor.versionId,
          expectedRevision: successor.revision,
        })
        .expect(200)
    ).body.data;
    await admin
      .send(path + '/grant', { versionId: draft.versionId, expectedRevision: resubmitted.revision })
      .expect(409);
    await admin
      .send(path + '/grant', {
        versionId: successor.versionId,
        expectedRevision: resubmitted.revision,
      })
      .expect(201);
    expect(
      await harness.observer.delegationVersion.findUnique({ where: { id: draft.versionId } }),
    ).toMatchObject({ state: 'RETURNED', reason: input.reason });
    expect(
      await harness.observer.delegationGrant.findUnique({
        where: { approvedVersionId: successor.versionId },
      }),
    ).toMatchObject({
      recipientId: accounts[3].id,
      seasonId: input.seasonId,
      actionCode: input.actionCode,
    });
  });

  it.each([
    ['PREPARE_REGULATION_CHANGE', 'REGISTRATION_OFFICER', 200],
    ['PREPARE_REGULATION_CHANGE', 'SCHEDULING_OFFICER', 200],
    ['PREPARE_REGULATION_CHANGE', 'RESULTS_OFFICER', 200],
    ['PREPARE_REGULATION_CHANGE', 'SEASON_MANAGER', 400],
    ['APPROVE_SCHEDULE_ADJUSTMENT', 'REGISTRATION_OFFICER', 400],
    ['APPROVE_SCHEDULE_ADJUSTMENT', 'SCHEDULING_OFFICER', 200],
    ['APPROVE_SCHEDULE_ADJUSTMENT', 'RESULTS_OFFICER', 400],
    ['APPROVE_SCHEDULE_ADJUSTMENT', 'SEASON_MANAGER', 400],
    ['PREPARE_OFFICIAL_RESULT_CORRECTION', 'REGISTRATION_OFFICER', 400],
    ['PREPARE_OFFICIAL_RESULT_CORRECTION', 'SCHEDULING_OFFICER', 400],
    ['PREPARE_OFFICIAL_RESULT_CORRECTION', 'RESULTS_OFFICER', 200],
    ['PREPARE_OFFICIAL_RESULT_CORRECTION', 'SEASON_MANAGER', 400],
  ])('checks D019 for %s and %s', async (actionCode, roleCode, status) => {
    const { accounts, seasons } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    await admin
      .send('/accounts/' + accounts[4].id + '/role-assignments', {
        seasonId: seasons[0].id,
        roleCode,
        expectedRevision: '1',
      })
      .expect(201);
    const manager = await harness.login(accounts[2].username);
    const draft = (
      await manager
        .send('/delegation-proposals', {
          seasonId: seasons[0].id,
          recipientId: accounts[4].id,
          actionCode,
          startMode: 'IMMEDIATE',
          endsAt: '2026-11-06T03:00:00Z',
          reason: 'Thử nghiệm',
        })
        .expect(201)
    ).body.data;
    await manager
      .send('/delegation-proposals/' + draft.id + '/submit', {
        versionId: draft.versionId,
        expectedRevision: draft.revision,
      })
      .expect(status);
  });
});
