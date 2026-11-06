import { randomUUID } from 'node:crypto';
import { administrationHarness, fixturePassword } from '../fixtures/admin-http';

describe('Phase 1 authorization and redaction regression', () => {
  const harness = administrationHarness();

  it('denies twelve distinct direct administration requests without modifying business data', async () => {
    const { accounts, seasons } = await harness.fixtures();
    const staff = await harness.login(accounts[3].username);
    const target = '/accounts/' + accounts[1].id;
    const revision = { expectedRevision: '1' };
    /** Reads the committed state that unauthorized requests must leave unchanged. */
    const snapshots = () =>
      Promise.all([
        harness.observer.account.findMany({
          orderBy: { id: 'asc' },
          select: { id: true, revision: true, authRevision: true, state: true },
        }),
        harness.observer.auditRecord.count(),
        harness.observer.commandReceipt.count(),
        harness.observer.systemRoleAssignment.count(),
        harness.observer.seasonRoleAssignment.count(),
        harness.observer.createSeasonGrant.count(),
      ]);
    const before = await snapshots();
    for (const path of [
      '/accounts',
      '/audit-logs',
      '/delegation-proposals',
      '/delegation-grants',
    ]) {
      const response = await staff.get(path).expect(403);
      expect(response.body).toMatchObject({
        error: { code: 'ACCESS_DENIED' },
        requestId: expect.any(String),
      });
      expect(response.body.data).toBeUndefined();
    }
    const deniedCommands: Array<[string, object, 'post' | 'patch']> = [
      [
        '/accounts',
        {
          personnelCode: 'DENIED-01',
          fullName: 'Nhân viên chưa được tạo',
          username: 'denied.01',
          temporaryPassword: fixturePassword,
        },
        'post',
      ],
      [target, { ...revision, fullName: 'Tên không được phép đổi' }, 'patch'],
      [target + '/lock', revision, 'post'],
      [target + '/unlock', revision, 'post'],
      [target + '/reset-password', { ...revision, temporaryPassword: fixturePassword }, 'post'],
      [
        target + '/role-assignments',
        { ...revision, seasonId: seasons[0].id, roleCode: 'SCHEDULING_OFFICER' },
        'post',
      ],
      [
        target + '/system-role-assignments',
        { ...revision, roleCode: 'SYSTEM_ADMINISTRATOR' },
        'post',
      ],
      [target + '/permission-grants', { ...revision, kind: 'CREATE_SEASON' }, 'post'],
    ];
    for (const [path, body, method] of deniedCommands) {
      const response = await staff.send(path, body, randomUUID(), method).expect(403);
      expect(response.body).toMatchObject({
        error: { code: 'ACCESS_DENIED' },
        requestId: expect.any(String),
      });
      expect(response.body.data).toBeUndefined();
    }
    expect(await snapshots()).toEqual(before);
  });

  it('bounds query input and protects credentials in account, session, audit and receipt projections', async () => {
    const { accounts, seasons } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const injection = "' OR 1=1 --";
    const query = new URLSearchParams({ actorId: injection });
    const rejection = await admin.get('/audit-logs?' + query).expect(400);
    expect(JSON.stringify(rejection.body).includes(injection)).toBe(false);
    const accountSearch = new URLSearchParams({ search: injection });
    const searched = await admin.get('/accounts?' + accountSearch).expect(200);
    expect(searched.body.data).toMatchObject({ total: 0, items: [] });

    const displayedText = '<img src=x onerror=alert(1)>';
    const added = await admin
      .send('/accounts', {
        personnelCode: 'SAFE-01',
        fullName: displayedText,
        username: 'safe.01',
        temporaryPassword: fixturePassword,
      })
      .expect(201);
    expect(added.body.data.fullName).toBe(displayedText);
    const { id, revision } = added.body.data;
    const key = randomUUID();
    const granted = await admin
      .send(
        '/accounts/' + id + '/role-assignments',
        {
          expectedRevision: revision,
          seasonId: seasons[0].id,
          roleCode: 'SCHEDULING_OFFICER',
        },
        key,
      )
      .expect(201);
    const [list, session, audit] = await Promise.all([
      admin.get('/accounts?search=safe.01').expect(200),
      admin.get('/auth/session').expect(200),
      admin.get('/audit-logs?objectId=' + id).expect(200),
    ]);
    const receipt = await harness.observer.commandReceipt.findFirstOrThrow({
      where: { requestKey: key },
      select: { responseData: true },
    });
    for (const projection of [
      added.body,
      granted.body,
      list.body,
      session.body,
      audit.body,
      receipt,
    ]) {
      const output = JSON.stringify(projection);
      expect(output.includes(fixturePassword)).toBe(false);
      expect(/passwordHash|temporaryPassword|csrfToken|tokenHash|\$argon2id\$/.test(output)).toBe(
        false,
      );
    }
    const stored = await harness.observer.account.findUniqueOrThrow({
      where: { id },
      select: { passwordHash: true },
    });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
  });
});
