import { administrationHarness, fixturePassword } from '../fixtures/admin-http';

describe('account administration HTTP contract', () => {
  const harness = administrationHarness();
  it('filters live roles and literal search terms before pagination and projects real last-login metadata', async () => {
    const { accounts } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const roles = await harness.observer.seasonRoleAssignment.findMany({
      where: { roleCode: 'SEASON_MANAGER', revokedAt: null },
    });
    const result = await admin.get('/accounts?roleCode=SEASON_MANAGER').expect(200);
    expect(result.body.data.items.map((row: { id: string }) => row.id).sort()).toEqual(
      [...new Set(roles.map((role) => role.accountId))].sort(),
    );
    expect(result.body.data.total).toBe(result.body.data.items.length);
    const self = await admin
      .get('/accounts?search=' + encodeURIComponent(accounts[0].username))
      .expect(200);
    expect(self.body.data.items[0].lastLoginAt).toEqual(expect.any(String));
    expect((await admin.get('/accounts?search=%25').expect(200)).body.data.total).toBe(0);
    await admin.get('/accounts?roleCode=UNKNOWN').expect(400);
  });
  it('creates a personal ordinary account, rejects duplicate identity and never returns credentials', async () => {
    const { accounts } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const person = {
      personnelCode: ' '.repeat(70) + 'staff-01',
      fullName: '  Nguyễn' + ' '.repeat(1100) + 'An ',
      username: 'staff.01',
      temporaryPassword: fixturePassword,
    };
    const created = await admin.send('/accounts', person).expect(201);
    expect(created.body.data).toMatchObject({
      personnelCode: 'STAFF-01',
      fullName: 'Nguyễn An',
      revision: '1',
    });
    await admin.send('/accounts', { ...person, username: 'staff.02' }).expect(409);
    await admin
      .send('/accounts', { ...person, personnelCode: 'STAFF-02', username: 'staff.02' })
      .expect(201);
    await admin
      .send('/accounts', { ...person, personnelCode: 'STAFF-ß', username: 'staff.03' })
      .expect(400);
    await admin.send('/accounts', { ...person, state: 'ACTIVE' }).expect(400);
    const list = await admin.get('/accounts?search=staff.01').expect(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toMatch(
      /passwordHash|temporaryPassword|csrfToken|authRevision/,
    );
    const newStaff = await harness.login(person.username);
    await newStaff.get('/accounts').expect(403);
  });
  it('requires another administrator to lock and keeps old sessions invalid after unlock', async () => {
    const { accounts } = await harness.fixtures();
    const [first, second] = accounts;
    const admin = await harness.login(first.username);
    const target = await harness.login(second.username);
    await admin.send('/accounts/' + first.id + '/lock', { expectedRevision: '1' }).expect(403);
    const lock = await admin
      .send('/accounts/' + second.id + '/lock', { expectedRevision: '1' })
      .expect(200);
    await target.get('/auth/session').expect(401);
    await admin
      .send('/accounts/' + second.id + '/unlock', { expectedRevision: lock.body.data.revision })
      .expect(200);
    await target.get('/auth/session').expect(401);
    expect(await harness.observer.account.findUnique({ where: { id: second.id } })).toMatchObject({
      state: 'ACTIVE',
      mustChangePassword: false,
    });
  });
});
