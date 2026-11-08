import { administrationHarness } from '../fixtures/admin-http';

describe('delegation proposal and grant contract', () => {
  const harness = administrationHarness();
  it('searches proposals and filters operations while retaining the manager ownership boundary', async () => {
    const {
      accounts: [first, , proposer, recipient, other],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(first.username);
    const manager = await harness.login(proposer.username);
    const input = {
      seasonId: season.id,
      recipientId: recipient.id,
      actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
      startMode: 'IMMEDIATE',
    };
    const own = (await manager.send('/delegation-proposals', input).expect(201)).body.data;
    await admin
      .send('/accounts/' + other.id + '/role-assignments', {
        expectedRevision: '1',
        roleCode: 'SEASON_MANAGER',
        seasonId: season.id,
      })
      .expect(201);
    const anotherManager = await harness.login(other.username);
    await anotherManager.send('/delegation-proposals', input).expect(201);
    const query =
      '?search=' +
      encodeURIComponent(proposer.username) +
      '&actionCode=APPROVE_SCHEDULE_ADJUSTMENT';
    const found = (await admin.get('/delegation-proposals' + query).expect(200)).body.data;
    expect(found.total).toBe(1);
    expect(found.items[0].id).toBe(own.id);
    expect(
      (
        await manager
          .get('/delegation-proposals?search=' + encodeURIComponent(other.username))
          .expect(200)
      ).body.data.total,
    ).toBe(0);
    expect((await admin.get('/delegation-proposals?search=%25').expect(200)).body.data.total).toBe(
      0,
    );
    await admin.get('/delegation-proposals?actionCode=UNKNOWN').expect(400);
    await (
      await harness.login(recipient.username)
    )
      .get('/delegation-proposals?search=test')
      .expect(403);
  });
  it('returns ordered unique recipients from only the authorized grant scope, independently of pagination', async () => {
    const {
      accounts: [first, second, proposer, recipient, other],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(first.username);
    await admin
      .send('/accounts/' + second.id + '/role-assignments', {
        expectedRevision: '1',
        roleCode: 'SEASON_MANAGER',
        seasonId: season.id,
      })
      .expect(201);
    const manager = await harness.login(proposer.username);
    const otherManager = await harness.login(second.username);
    await admin
      .send('/accounts/' + other.id + '/role-assignments', {
        expectedRevision: '1',
        roleCode: 'RESULTS_OFFICER',
        seasonId: season.id,
      })
      .expect(201);
    /** Creates a valid scheduled grant through the same separated proposal/approval flow as production. */
    async function grantFor(
      owner: Awaited<ReturnType<typeof harness.login>>,
      content: { recipientId: string; actionCode: string; startsAt: string; endsAt: string },
    ) {
      const draft = (
        await owner
          .send('/delegation-proposals', {
            ...content,
            seasonId: season.id,
            startMode: 'SCHEDULED',
            reason: 'Hỗ trợ nghiệp vụ',
          })
          .expect(201)
      ).body.data;
      const path = '/delegation-proposals/' + draft.id;
      const pending = (
        await owner
          .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
          .expect(200)
      ).body.data;
      await admin
        .send(path + '/grant', { versionId: pending.versionId, expectedRevision: pending.revision })
        .expect(201);
    }
    for (const day of [6, 8])
      await grantFor(manager, {
        recipientId: recipient.id,
        actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
        startsAt: `2026-11-0${day}T03:00:00Z`,
        endsAt: `2026-11-0${day + 1}T03:00:00Z`,
      });
    await grantFor(otherManager, {
      recipientId: other.id,
      actionCode: 'PREPARE_OFFICIAL_RESULT_CORRECTION',
      startsAt: '2026-11-06T03:00:00Z',
      endsAt: '2026-11-07T03:00:00Z',
    });
    const all = (await admin.get('/delegation-grants?pageSize=1').expect(200)).body.data;
    expect(all.items).toHaveLength(1);
    expect(all.total).toBe(3);
    expect(all.recipients.map((person: { id: string }) => person.id)).toEqual([
      recipient.id,
      other.id,
    ]);
    const own = (await manager.get('/delegation-grants?pageSize=1').expect(200)).body.data;
    expect(own.total).toBe(2);
    expect(own.recipients.map((person: { id: string }) => person.id)).toEqual([recipient.id]);
  });
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
    const matching = (
      await administrator
        .get('/delegation-grants?search=' + encodeURIComponent('lịch thi đấu'))
        .expect(200)
    ).body.data;
    expect(matching.total).toBe(1);
    expect(matching.items[0].recipient.id).toBe(recipient.id);
    expect(matching.recipients).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: recipient.id })]),
    );
    const spaced = await administrator
      .get('/delegation-grants?search=' + encodeURIComponent('lịch  \t thi đấu'))
      .expect(200);
    expect(spaced.body.data.total).toBe(1);
    expect(spaced.body.data.items[0].id).toBe(matching.items[0].id);
    expect(
      (await administrator.get('/delegation-grants?search=%25').expect(200)).body.data.total,
    ).toBe(0);
    expect(
      (
        await administrator
          .get('/delegation-grants?actionCode=PREPARE_REGULATION_CHANGE')
          .expect(200)
      ).body.data.total,
    ).toBe(0);
    await administrator.get('/delegation-grants?actionCode=UNKNOWN').expect(400);
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
    const granted = await harness.observer.delegationGrant.findUniqueOrThrow({
      where: { approvedVersionId: successor.versionId },
    });
    expect(
      await harness.observer.auditRecord.findFirstOrThrow({
        where: { objectId: granted.id, actionCode: 'DELEGATION_STARTED' },
      }),
    ).toMatchObject({
      beforeData: expect.objectContaining({ state: 'GRANTED' }),
      afterData: expect.objectContaining({ state: 'ACTIVE' }),
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
