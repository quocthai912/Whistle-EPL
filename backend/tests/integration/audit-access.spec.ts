import { randomUUID } from 'node:crypto';
import { administrationHarness } from '../fixtures/admin-http';

describe('protected audit lookup', () => {
  const harness = administrationHarness();

  it('requires an administrator and projects only currently permitted audit metadata and changes', async () => {
    const { accounts } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const staff = await harness.login(accounts[2].username);
    const now = new Date('2026-11-05T03:00:00Z');
    const protectedId = randomUUID();
    await harness.observer.auditRecord.create({
      data: {
        actorKind: 'ACCOUNT',
        actorId: accounts[0].id,
        occurredAt: now,
        actionCode: 'ACCOUNT_UPDATED',
        objectKind: 'InternalProfile',
        objectId: protectedId,
        outcome: 'SUCCESS',
        reason: 'restricted-evidence',
        afterData: { fullName: 'restricted-profile' },
      },
    });
    await admin
      .send(
        '/accounts/' + accounts[2].id,
        {
          expectedRevision: '1',
          fullName: 'Tên đã cập nhật',
        },
        randomUUID(),
        'patch',
      )
      .expect(200);
    await staff.get('/audit-logs').expect(403);
    const response = await admin.get('/audit-logs?actionCode=ACCOUNT_UPDATED').expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ objectId: protectedId, reason: null, after: null }),
        expect.objectContaining({
          objectId: accounts[2].id,
          after: { fullName: 'Tên đã cập nhật' },
        }),
      ]),
    );
    expect(JSON.stringify(response.body)).not.toMatch(
      /restricted-|passwordHash|tokenHash|csrfToken/,
    );
  });

  it('filters exact identifiers and half-open times, with stable pages and no read mutation', async () => {
    const { accounts } = await harness.fixtures();
    const admin = await harness.login(accounts[0].username);
    const occurredAt = new Date('2026-11-05T03:00:00Z');
    const rows = Array.from({ length: 23 }, () => ({
      id: randomUUID(),
      actorKind: 'ACCOUNT',
      actorId: accounts[0].id,
      occurredAt,
      actionCode: 'ACCOUNT_UPDATED',
      objectKind: 'Account',
      objectId: accounts[1].id,
      outcome: 'SUCCESS',
    }));
    await harness.observer.auditRecord.createMany({ data: rows });
    const auditBefore = await harness.observer.auditRecord.findMany({ orderBy: { id: 'asc' } });
    const sessionsBefore = await harness.observer.session.findMany({ orderBy: { id: 'asc' } });
    harness.clock.set(new Date('2026-11-05T03:01:00Z'));
    const path =
      '/audit-logs?' +
      new URLSearchParams({
        actionCode: 'ACCOUNT_UPDATED',
        actorId: accounts[0].id,
        objectId: accounts[1].id,
        objectKind: 'Account',
        occurredFrom: occurredAt.toISOString(),
        occurredBefore: '2026-11-05T03:00:01Z',
      });
    const first = (await admin.get(path).expect(200)).body.data;
    const second = (await admin.get(path + '&page=2').expect(200)).body.data;
    expect(first).toMatchObject({ total: 23, page: 1, pageSize: 20 });
    expect(second).toMatchObject({ total: 23, page: 2, pageSize: 20 });
    expect([...first.items, ...second.items].map(({ id }) => id)).toEqual(
      rows.map(({ id }) => id).sort(),
    );
    expect((await admin.get(path + '&pageSize=100').expect(200)).body.data.items).toHaveLength(23);
    expect(
      (await admin.get('/audit-logs?occurredBefore=' + occurredAt.toISOString()).expect(200)).body
        .data,
    ).toMatchObject({ total: 0, items: [] });
    for (const filter of [
      'pageSize=101',
      'page=0',
      'page=1&page=2',
      'sort=id:asc',
      'export=true',
      'actorId=%27%20OR%201%3D1',
      'actionCode=constructor',
      'objectKind=invalid',
      'occurredFrom=2026-02-30T03:00:00Z',
      'occurredFrom=2026-11-06T00:00:00Z&occurredBefore=2026-11-05T00:00:00Z',
    ]) {
      const failure = await admin.get('/audit-logs?' + filter).expect(400);
      expect(failure.body).toMatchObject({
        requestId: expect.any(String),
        error: { code: 'VALIDATION_FAILED' },
      });
    }
    await admin.get('/audit-logs/export').expect(404);
    await admin.send('/audit-logs', {}).expect(404);
    await admin.send('/audit-logs/' + rows[0].id, {}, randomUUID(), 'patch').expect(404);
    expect(await harness.observer.auditRecord.findMany({ orderBy: { id: 'asc' } })).toEqual(
      auditBefore,
    );
    expect(await harness.observer.session.findMany({ orderBy: { id: 'asc' } })).toEqual(
      sessionsBefore,
    );
  });
});
