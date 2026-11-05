import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { administrationHarness } from '../fixtures/admin-http';
import { waitForBlockedBy } from '../fixtures/test-clock';

describe('atomic administration across independent database connections', () => {
  const harness = administrationHarness();
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  afterAll(() => pool.end());

  it('rolls back account lock, revocation and receipt when required audit cannot be saved', async () => {
    const {
      accounts: [actor, target],
    } = await harness.fixtures();
    const admin = await harness.login(actor.username);
    const targetSession = await harness.login(target.username);
    const key = randomUUID();
    await pool.query(`CREATE FUNCTION test_fail_lock_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action_code='ACCOUNT_LOCKED' THEN RAISE EXCEPTION 'injected audit failure'; END IF;
      RETURN NEW; END $$;
      CREATE TRIGGER test_fail_lock_audit BEFORE INSERT ON audit_record FOR EACH ROW EXECUTE FUNCTION test_fail_lock_audit()`);
    const path = '/accounts/' + target.id + '/lock';
    try {
      await admin.send(path, { expectedRevision: '1' }, key).expect(500);
      expect(await harness.observer.account.findUnique({ where: { id: target.id } })).toMatchObject(
        { state: 'ACTIVE', revision: 1n, authRevision: 1n },
      );
      expect(await harness.observer.commandReceipt.count({ where: { requestKey: key } })).toBe(0);
      await targetSession.get('/auth/session').expect(200);
    } finally {
      await pool.query(
        'DROP TRIGGER test_fail_lock_audit ON audit_record; DROP FUNCTION test_fail_lock_audit()',
      );
    }
    await admin.send(path, { expectedRevision: '1' }, key).expect(200);
  });

  it.each(['expired', 'revoked'] as const)(
    'rejects %s authority after an observed account lock wait',
    async (cause) => {
      const {
        accounts: [actor, target],
      } = await harness.fixtures();
      const admin = await harness.login(actor.username);
      const blocker = await pool.connect();
      const pid = (await blocker.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]
        .pid;
      await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM account WHERE id=$1 FOR UPDATE', [actor.id]);
      const key = randomUUID();
      const pending = admin
        .send('/accounts/' + target.id + '/lock', { expectedRevision: '1' }, key)
        .then((result) => result);
      try {
        await waitForBlockedBy(pool, pid);
        if (cause === 'expired') harness.clock.set(new Date('2026-11-05T03:30:00Z'));
        else
          await blocker.query(
            'UPDATE system_role_assignment SET revoked_at=clock_timestamp() WHERE account_id=$1',
            [actor.id],
          );
        await blocker.query('COMMIT');
        expect((await pending).status).toBe(cause === 'expired' ? 401 : 403);
        expect(
          await harness.observer.account.findUnique({ where: { id: target.id } }),
        ).toMatchObject({ state: 'ACTIVE', revision: 1n });
        expect(await harness.observer.commandReceipt.count({ where: { requestKey: key } })).toBe(0);
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
        await pending.catch(() => {});
      }
    },
  );

  it('recovers a committed outcome when the HTTP connection closes before acknowledgement', async () => {
    const {
      accounts: [actor, target],
    } = await harness.fixtures();
    const admin = await harness.login(actor.username);
    const path = '/accounts/' + target.id + '/lock';
    const key = randomUUID();
    harness.dropNextResponse(key);
    await expect(admin.send(path, { expectedRevision: '1' }, key)).rejects.toThrow();
    const recovered = await admin.send(path, { expectedRevision: '1' }, key).expect(200);
    expect(recovered.body.data).toEqual({ id: target.id, revision: '2' });
    await admin.send(path, { expectedRevision: '2' }, key).expect(409);
    expect(
      await harness.observer.auditRecord.count({
        where: { objectId: target.id, actionCode: 'ACCOUNT_LOCKED' },
      }),
    ).toBe(1);
    expect(
      await harness.observer.commandReceipt.count({
        where: { requestKey: key, outcomeState: 'COMPLETED' },
      }),
    ).toBe(1);
  });

  it('serializes concurrent overlapping grants and permits an adjacent interval', async () => {
    const {
      accounts: [actor, other, manager, recipient],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(actor.username);
    const admin2 = await harness.login(other.username);
    const proposer = await harness.login(manager.username);
    const oldRecipientSession = await harness.login(recipient.username);
    /** Submits a proposal that a separate administrator can use to exercise grant contention. */
    async function proposal(start: string, end: string) {
      const {
        body: { data: draft },
      } = await proposer
        .send('/delegation-proposals', {
          seasonId: season.id,
          recipientId: recipient.id,
          actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
          startMode: start ? 'SCHEDULED' : 'IMMEDIATE',
          ...(start && { startsAt: start }),
          endsAt: end,
          reason: 'Duyệt điều chỉnh lịch',
        })
        .expect(201);
      const path = '/delegation-proposals/' + draft.id;
      const {
        body: { data: pending },
      } = await proposer
        .send(path + '/submit', { versionId: draft.versionId, expectedRevision: draft.revision })
        .expect(200);
      return {
        path: path + '/grant',
        body: { versionId: pending.versionId, expectedRevision: pending.revision },
      };
    }
    const [a, b, c] = [
      await proposal('', '2026-11-05T03:10:00Z'),
      await proposal('', '2026-11-05T03:10:00Z'),
      await proposal('2026-11-05T03:10:00Z', '2026-11-05T03:15:00Z'),
    ];
    const results = await Promise.all([admin.send(a.path, a.body), admin2.send(b.path, b.body)]);
    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    await oldRecipientSession.get('/auth/session').expect(401);
    const fresh = await harness.login(recipient.username);
    await admin.send(c.path, c.body).expect(201);
    await fresh.get('/auth/session').expect(200);
    expect(
      await harness.observer.delegationGrant.count({ where: { recipientId: recipient.id } }),
    ).toBe(2);
    expect(await harness.observer.delegationVersion.count({ where: { state: 'PENDING' } })).toBe(1);
  });
});
