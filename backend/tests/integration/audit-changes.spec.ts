import { randomUUID } from 'node:crypto';
import { administrationHarness, fixturePassword } from '../fixtures/admin-http';

describe('Phase 1 audit change history', () => {
  const harness = administrationHarness();

  it('records both sides of every account authority change, including automatic shared-right loss', async () => {
    const {
      accounts: [administrator, , , target],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(administrator.username);
    const path = '/accounts/' + target.id;
    let revision = '1';
    /** Sends each fixture change with the revision returned by the preceding command. */
    async function command(suffix: string, body: object, status: number) {
      const result = await admin
        .send(path + suffix, { ...body, expectedRevision: revision })
        .expect(status);
      revision = result.body.data.revision;
      return result.body.data.relatedId as string;
    }
    const system = await command(
      '/system-role-assignments',
      { roleCode: 'SYSTEM_ADMINISTRATOR' },
      201,
    );
    await command('/system-role-assignments/' + system + '/revoke', {}, 200);
    const create = await command('/permission-grants', { kind: 'CREATE_SEASON' }, 201);
    await command('/permission-grants/' + create + '/revoke', { kind: 'CREATE_SEASON' }, 200);
    const shared = await command('/permission-grants', { kind: 'STADIUM_MASTER' }, 201);
    await command('/permission-grants/' + shared + '/revoke', { kind: 'STADIUM_MASTER' }, 200);
    await command('/permission-grants', { kind: 'STADIUM_MASTER' }, 201);
    const assignments = await harness.observer.seasonRoleAssignment.findMany({
      where: { accountId: target.id, roleCode: 'SCHEDULING_OFFICER', revokedAt: null },
    });
    for (const assignment of assignments)
      await command('/role-assignments/' + assignment.id + '/revoke', {}, 200);
    await command(
      '/role-assignments',
      { seasonId: season.id, roleCode: 'SCHEDULING_OFFICER' },
      201,
    );
    const records = (
      await admin.get('/audit-logs?objectId=' + target.id + '&pageSize=100').expect(200)
    ).body.data.items;
    for (const action of [
      'SYSTEM_ROLE_GRANTED',
      'SYSTEM_ROLE_REVOKED',
      'CREATE_SEASON_GRANTED',
      'CREATE_SEASON_REVOKED',
      'SHARED_GRANT_GRANTED',
      'SHARED_GRANT_ENDED',
      'SEASON_ROLE_GRANTED',
      'SEASON_ROLE_REVOKED',
    ]) {
      const matches = records.filter((row: { actionCode: string }) => row.actionCode === action);
      expect(matches.length).toBeGreaterThan(0);
      const granted = action.endsWith('_GRANTED');
      for (const row of matches) {
        expect(row.before).toMatchObject({ granted: !granted });
        expect(row.after).toMatchObject({ granted });
      }
    }
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionCode: 'SHARED_GRANT_ENDED',
          reason: 'Vai trò điều kiện cuối cùng đã bị thu hồi.',
        }),
      ]),
    );
    await admin
      .send(path, { expectedRevision: revision, fullName: 'Tên mới' }, randomUUID(), 'patch')
      .expect(200);
    revision = (
      await harness.observer.account.findUniqueOrThrow({ where: { id: target.id } })
    ).revision.toString();
    await command('/lock', {}, 200);
    await command('/unlock', {}, 200);
    await command('/reset-password', { temporaryPassword: fixturePassword }, 200);
    const reset = await harness.observer.auditRecord.findFirstOrThrow({
      where: { objectId: target.id, actionCode: 'PASSWORD_RESET' },
    });
    expect(reset.beforeData).toEqual({ mustChangePassword: false });
    expect(reset.afterData).toMatchObject({ mustChangePassword: true });
    const restricted = await harness.login(target.username);
    await restricted
      .send('/auth/password/change', {
        currentPassword: fixturePassword,
        newPassword: 'New synthetic personal credential only',
      })
      .expect(200);
    const changed = await harness.observer.auditRecord.findFirstOrThrow({
      where: { objectId: target.id, actionCode: 'PASSWORD_CHANGED' },
    });
    expect(changed.beforeData).toEqual({ mustChangePassword: true });
    expect(changed.afterData).toMatchObject({ mustChangePassword: false });
    expect(JSON.stringify(changed)).not.toContain('New synthetic personal credential only');
    expect(JSON.stringify(records)).not.toMatch(/passwordHash|csrfToken|tokenHash/);
  });

  it('preserves proposal content before edits and state before each decision', async () => {
    const {
      accounts: [administrator, , proposer, recipient],
      seasons: [season],
    } = await harness.fixtures();
    const admin = await harness.login(administrator.username);
    const manager = await harness.login(proposer.username);
    const original = {
      recipientId: recipient.id,
      actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
      startMode: 'SCHEDULED',
      startsAt: '2026-11-05T03:05:00Z',
      endsAt: '2026-11-05T04:00:00Z',
      reason: 'Hỗ trợ lịch thi đấu',
    };
    let proposal = (
      await manager.send('/delegation-proposals', { ...original, seasonId: season.id }).expect(201)
    ).body.data;
    const path = '/delegation-proposals/' + proposal.id;
    proposal = (
      await manager
        .send(
          path,
          {
            ...original,
            reason: 'Cập nhật thời hạn hỗ trợ',
            endsAt: '2026-11-05T05:00:00Z',
            expectedRevision: proposal.revision,
          },
          randomUUID(),
          'patch',
        )
        .expect(200)
    ).body.data;
    proposal = (
      await manager
        .send(path + '/submit', {
          expectedRevision: proposal.revision,
          versionId: proposal.versionId,
        })
        .expect(200)
    ).body.data;
    await admin
      .send(path + '/grant', { expectedRevision: proposal.revision, versionId: proposal.versionId })
      .expect(201);
    const history = await harness.observer.auditRecord.findMany({
      where: { objectId: proposal.id },
    });
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionCode: 'DELEGATION_EDITED',
          beforeData: expect.objectContaining({
            endsAt: '2026-11-05T04:00:00.000Z',
            reason: original.reason,
          }),
          afterData: expect.objectContaining({
            endsAt: '2026-11-05T05:00:00.000Z',
            reason: 'Cập nhật thời hạn hỗ trợ',
          }),
        }),
        expect.objectContaining({
          actionCode: 'DELEGATION_SUBMITTED',
          beforeData: expect.objectContaining({ state: 'DRAFT' }),
          afterData: expect.objectContaining({ state: 'PENDING' }),
        }),
        expect.objectContaining({
          actionCode: 'DELEGATION_GRANTED',
          beforeData: expect.objectContaining({ state: 'PENDING' }),
          afterData: expect.objectContaining({ state: 'GRANTED' }),
        }),
      ]),
    );
    const grant = await harness.observer.delegationGrant.findUniqueOrThrow({
      where: { approvedVersionId: proposal.versionId },
    });
    const current = await harness.observer.delegationCase.findUniqueOrThrow({
      where: { id: proposal.id },
    });
    await admin
      .send('/delegation-grants/' + grant.id + '/revoke', {
        expectedRevision: current.revision.toString(),
        reason: 'Kết thúc hỗ trợ',
      })
      .expect(200);
    expect(
      await harness.observer.auditRecord.findFirstOrThrow({
        where: { objectId: grant.id, actionCode: 'DELEGATION_REVOKED' },
      }),
    ).toMatchObject({
      beforeData: expect.objectContaining({ state: 'SCHEDULED' }),
      afterData: expect.objectContaining({ state: 'REVOKED' }),
    });
  });
});
