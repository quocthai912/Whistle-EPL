import { administrationHarness } from '../fixtures/admin-http';

describe('permission consistency', () => {
  const harness = administrationHarness();
  it('serializes two administrators trying to lock each other', async () => {
    const {
      accounts: [one, two],
    } = await harness.fixtures();
    const a = await harness.login(one.username);
    const b = await harness.login(two.username);
    const results = await Promise.all([
      a.send('/accounts/' + two.id + '/lock', { expectedRevision: '1' }),
      b.send('/accounts/' + one.id + '/lock', { expectedRevision: '1' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(
      await harness.observer.systemRoleAssignment.count({
        where: { revokedAt: null, account: { state: 'ACTIVE' } },
      }),
    ).toBe(1);
  });
  it('requires a separate shared grant and only ends it on loss of the final prerequisite across seasons', async () => {
    const { accounts, seasons } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const target = accounts[3];
    const path = '/accounts/' + target.id;
    await admin
      .send('/accounts/' + accounts[0].id + '/permission-grants', {
        kind: 'CREATE_SEASON',
        expectedRevision: '1',
      })
      .expect(403);
    await admin
      .send(path + '/permission-grants', { kind: 'STADIUM_MASTER', expectedRevision: '1' })
      .expect(201);
    const extra = await admin
      .send(path + '/role-assignments', {
        seasonId: seasons[1].id,
        roleCode: 'SCHEDULING_OFFICER',
        expectedRevision: '2',
      })
      .expect(201);
    const original = await harness.observer.seasonRoleAssignment.findFirstOrThrow({
      where: { accountId: target.id, seasonId: seasons[0].id },
    });
    await admin
      .send(path + '/role-assignments/' + original.id + '/revoke', { expectedRevision: '3' })
      .expect(200);
    expect(
      await harness.observer.sharedMasterGrant.count({
        where: { accountId: target.id, endedAt: null },
      }),
    ).toBe(1);
    await admin
      .send(path + '/role-assignments/' + extra.body.data.relatedId + '/revoke', {
        expectedRevision: '4',
      })
      .expect(200);
    expect(
      await harness.observer.sharedMasterGrant.count({
        where: { accountId: target.id, endedAt: null },
      }),
    ).toBe(0);
  });
});
