import { randomUUID } from 'node:crypto';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { ApplicationError } from '../../src/platform/application-error';
import { BusinessExecutionService } from '../../src/platform/business-execution';
import { CommandReceiptService } from '../../src/platform/command-receipt.service';
import { LockSetChanged } from '../../src/platform/transaction-context';
import { assertAvailableForNewUse } from '../../src/platform/master-availability';
import { RegulationActivationService } from '../../src/season-regulations/regulation-activation.service';
import { SeasonDependenciesService } from '../../src/season-regulations/season-dependencies.service';
import {
  registrationClosingFactsProvider,
  registrationMasterImpactProvider,
  registrationPublicMediaBasisProvider,
  registryRegistrationDependencyModule,
} from '../../src/registry-registration/registration-dependency-facts';
import {
  assertIndependentApprover,
  assertMastersAvailableForNewUse,
  discoverSeasonWithDueRules,
  requirePlayerMasterWrite,
  requireSeasonManager,
  requireSeasonRegistrationOfficer,
  resolveEffectiveRegulationForWrite,
} from '../../src/registry-registration/registration-execution';
import { barrier } from '../fixtures/test-clock';
import {
  assertDistinctIsolatedTargets,
  assertIsolatedMediaRoot,
  DECLARED_TEST_ONLY_REGULATION,
  setupPhase3HttpFixture,
} from './phase-3-fixtures';

describe('PHASE 3 execution, authority, D099 races and live dependency fact providers (T002/T004)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-10T10:00:00.000Z');

  it('guards isolated fixture targets, media roots and declared test-only markers (T002)', () => {
    expect(DECLARED_TEST_ONLY_REGULATION.testOnly).toBe(true);
    expect(DECLARED_TEST_ONLY_REGULATION.evidenceKind).toBe('ISOLATED_TEST_FIXTURE');
    expect(() => assertIsolatedMediaRoot('/var/lib/whistle/media')).toThrow();
    expect(() => assertIsolatedMediaRoot('relative/media')).toThrow();
    expect(() =>
      assertDistinctIsolatedTargets({
        integration: 'postgresql://fixture:fixture@127.0.0.1:55438/whistle_test_same',
        browser: 'postgresql://fixture:fixture@localhost:55438/whistle_test_same',
      }),
    ).toThrow('must not share');
  });

  it('enforces live authority checks and rejects revoked access under concurrent lock wait', async () => {
    const execution = new BusinessExecutionService(fixture.database);
    const seasonId = fixture.seasons[0].id;
    const officerId = fixture.staff.registrationOfficerA;
    const adminId = fixture.staff.admin;
    const hold = barrier();
    const entered = barrier();

    const locker = fixture.database.write(
      [{ kind: 'season', key: seasonId, mode: 'exclusive' }],
      async () => {},
      async () => {
        entered.release();
        await hold.reached;
      },
    );
    await entered.reached;

    const pendingWrite = execution.execute(
      {
        principal: { kind: 'session', accountId: officerId },
        locks: [
          { kind: 'account', key: officerId, mode: 'shared' },
          { kind: 'season', key: seasonId, mode: 'exclusive' },
        ],
        authority: (context) => requireSeasonRegistrationOfficer(context, officerId, seasonId),
      },
      async () => 'SHOULD_NOT_RUN',
    );

    // Revoke the officer's seasonal role while the write is waiting on the season lock.
    await fixture.database.client.seasonRoleAssignment.updateMany({
      where: { accountId: officerId, seasonId, revokedAt: null },
      data: { revokedAt: await fixture.database.now() },
    });
    hold.release();
    await locker;

    await expect(pendingWrite).rejects.toMatchObject({ status: 403, code: 'ACCESS_DENIED' });

    // Global admin without PLAYER_MASTER grant is denied Player master write.
    await expect(
      execution.execute(
        {
          principal: { kind: 'session', accountId: adminId },
          locks: [{ kind: 'account', key: adminId, mode: 'shared' }],
          authority: (context, now) => requirePlayerMasterWrite(context, adminId, now),
        },
        async () => 'DENIED',
      ),
    ).rejects.toMatchObject({ status: 403, code: 'ACCESS_DENIED' });

    // Independent approver rejects both preparer and former editor.
    expect(() =>
      assertIndependentApprover(officerId, [fixture.staff.seasonManagerA], officerId),
    ).toThrow(ApplicationError);
    expect(() =>
      assertIndependentApprover(
        officerId,
        [fixture.staff.seasonManagerA],
        fixture.staff.seasonManagerA,
      ),
    ).toThrow(ApplicationError);
    expect(() =>
      assertIndependentApprover(
        officerId,
        [fixture.staff.seasonManagerA],
        fixture.staff.seasonManagerB,
      ),
    ).not.toThrow();
  });

  it('serializes D099 discontinuation against a competing new-use check under exclusive master locks', async () => {
    const { club, stadium } = await fixture.seedClubAndStadium('RACE1');
    const execution = new BusinessExecutionService(fixture.database);
    const hold = barrier();
    const locked = barrier();

    // Writer A holds exclusive club lock and marks club discontinued.
    const discontinuer = fixture.database.write(
      [{ kind: 'club', key: club.id, mode: 'exclusive' }],
      async () => {},
      async (context) => {
        locked.release();
        await hold.reached;
        await context.db.club.update({
          where: { id: club.id },
          data: { discontinuedAt: await context.now(), revision: { increment: 1 } },
        });
      },
    );
    await locked.reached;

    // Writer B attempts new use of club & stadium in D096 order; waits behind discontinuer and fails closed.
    const newUse = execution.execute(
      {
        principal: { kind: 'session', accountId: fixture.staff.seasonManagerA },
        locks: [
          { kind: 'club', key: club.id, mode: 'exclusive' },
          { kind: 'stadium', key: stadium.id, mode: 'exclusive' },
        ],
        authority: (context) =>
          requireSeasonManager(context, fixture.staff.seasonManagerA, fixture.seasons[0].id),
      },
      async (context) => {
        await assertMastersAvailableForNewUse(context, { clubId: club.id, stadiumId: stadium.id });
        return 'COMMITTED';
      },
    );

    hold.release();
    await discontinuer;
    await expect(newUse).rejects.toMatchObject({ status: 409, code: 'MASTER_DISCONTINUED' });
    // Sanity check direct helper still passes for active stadium.
    await expect(
      fixture.database.write(
        [{ kind: 'stadium', key: stadium.id, mode: 'exclusive' }],
        async () => {},
        (context) => assertAvailableForNewUse(context, 'stadium', stadium.id),
      ),
    ).resolves.toBeUndefined();
  });

  it('wires live registrationCompatibility, closure, masterImpact and publicMediaScope providers and rejects partial/unavailable sources', async () => {
    const seasonId = fixture.seasons[0].id;
    const { club, stadium } = await fixture.seedClubAndStadium('FACT1');
    const player = await fixture.seedPlayer('P3_FACT_01', 'Cầu thủ Dữ liệu', '2003-04-05');
    const reg = await fixture.seedEffectiveRegulation(seasonId);

    // Seed an approved club application and a validated playing registration (future-ending)
    const appCaseId = randomUUID();
    const appV1 = randomUUID();
    await fixture.database.client.clubApplication.create({
      data: { id: appCaseId, seasonId, clubId: club.id },
    });
    await fixture.database.client.clubApplicationVersion.create({
      data: {
        id: appV1,
        seasonId,
        caseId: appCaseId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'APPROVED',
        receivedAt: new Date('2026-08-06T10:00:00.000Z'),
        homeStadiumId: stadium.id,
        receiptRegulationVersionId: reg.versionId,
        approvalRegulationVersionId: reg.versionId,
      },
    });
    await fixture.database.client.clubApplication.update({
      where: { id: appCaseId },
      data: { currentAcceptedVersionId: appV1 },
    });

    const regCaseId = randomUUID();
    const regV1 = randomUUID();
    await fixture.database.client.playerRegistration.create({
      data: { id: regCaseId, seasonId, clubId: club.id, playerId: player.id },
    });
    await fixture.database.client.registrationVersion.create({
      data: {
        id: regV1,
        seasonId,
        caseId: regCaseId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'VALID',
        receivedAt: new Date('2026-08-06T10:00:00.000Z'),
        shirtNumber: 10,
        playingStart: new Date('2026-08-08T00:00:00.000Z'),
        playingEnd: new Date('2026-12-31T00:00:00.000Z'),
        u21Finding: false,
        homegrownFinding: true,
        playingDisposition: 'ACTIVE',
        receiptRegulationVersionId: reg.versionId,
        decisionRegulationVersionId: reg.versionId,
      },
    });
    await fixture.database.client.playerRegistration.update({
      where: { id: regCaseId },
      data: { currentValidatedVersionId: regV1 },
    });

    const dependencies = new SeasonDependenciesService({
      registeredWriters: [registryRegistrationDependencyModule.writer],
      providers: registryRegistrationDependencyModule.providers,
    });

    // Startup catalog passes with live registry-registration registrationCompatibility provider
    await fixture.database.client.$transaction((tx) => dependencies.assertStartupCatalog(tx));

    // registrationCompatibility returns KNOWN real interval composition under shared locks
    const compatResult = await fixture.database.write(
      [{ kind: 'season', key: seasonId, mode: 'shared' }],
      async () => {},
      async (context) => {
        return dependencies.read('registrationCompatibility', context, {
          seasonId,
          candidateVersionId: reg.versionId,
        });
      },
      async (db) => [
        ...(
          await dependencies.discover('registrationCompatibility', db, {
            seasonId,
            candidateVersionId: reg.versionId,
          })
        ).locks,
      ],
    );
    expect(compatResult.status).toBe('KNOWN');
    if (compatResult.status === 'KNOWN') {
      expect(compatResult.facts.intervalCompositions).toHaveLength(1);
      expect(compatResult.facts.intervalCompositions[0].registrations).toEqual([
        expect.objectContaining({
          registrationId: regCaseId,
          versionId: regV1,
          playerId: player.id,
          clubId: club.id,
          u21: false,
          homegrown: true,
        }),
      ]);
    }

    // Composite ports whose later-Phase tables/writers are absent MUST fail closed as UNAVAILABLE (never VERIFIED_NOT_INTRODUCED)
    const compositeStatus = await fixture.database.client.$transaction(async (tx) => ({
      masterImpact: await dependencies.discover('masterImpact', tx, {
        seasonId,
        resourceKind: 'CLUB',
        resourceId: club.id,
      }),
      closingReadiness: await dependencies.discover('seasonClosingReadiness', tx, { seasonId }),
      publicMediaScope: await dependencies.discover('publicMediaScope', tx, {
        seasonId,
        ownerKind: 'PLAYER',
        ownerId: player.id,
      }),
    }));
    expect(compositeStatus.masterImpact.status).toBe('UNAVAILABLE');
    expect(compositeStatus.closingReadiness.status).toBe('UNAVAILABLE');
    expect(compositeStatus.publicMediaScope.status).toBe('UNAVAILABLE');

    // Direct PHASE 3 providers report real closure, master-impact and public-media registration basis under shared locks
    await fixture.database.write(
      [],
      async () => {},
      async (context) => {
        const closing = await registrationClosingFactsProvider.read(context, { seasonId });
        expect(closing.playingIntervals).toEqual([
          { registrationId: regCaseId, playingEnd: '2026-12-31T00:00:00.000Z' },
        ]);
        expect(closing.unresolvedFuturePlans).toEqual([]);

        const clubImpact = await registrationMasterImpactProvider.read(context, {
          seasonId,
          resourceKind: 'CLUB',
          resourceId: club.id,
        });
        expect(clubImpact.facts.affected).toEqual(
          expect.arrayContaining([
            { kind: 'REGISTRATION', id: appCaseId },
            { kind: 'REGISTRATION', id: regCaseId },
          ]),
        );

        const stadiumImpact = await registrationMasterImpactProvider.read(context, {
          seasonId,
          resourceKind: 'STADIUM',
          resourceId: stadium.id,
        });
        expect(stadiumImpact.facts.affected).toEqual([{ kind: 'REGISTRATION', id: appCaseId }]);

        const mediaBasis = await registrationPublicMediaBasisProvider.read(context, {
          seasonId,
          ownerKind: 'PLAYER',
          ownerId: player.id,
        });
        expect(mediaBasis.eligible).toBe(true);
        expect(mediaBasis.basisReference).toBe(regV1);
      },
      async (db) => [
        ...(await registrationClosingFactsProvider.discoverLocks(db, { seasonId })),
        ...(await registrationMasterImpactProvider.discoverLocks(db, {
          seasonId,
          resourceKind: 'CLUB',
          resourceId: club.id,
        })),
        ...(await registrationMasterImpactProvider.discoverLocks(db, {
          seasonId,
          resourceKind: 'STADIUM',
          resourceId: stadium.id,
        })),
        ...(await registrationPublicMediaBasisProvider.discoverLocks(db, {
          seasonId,
          ownerKind: 'PLAYER',
          ownerId: player.id,
        })),
      ],
    );
  });

  it('resolves due regulation inside dependent writes and rolls back cleanly on failure', async () => {
    const seasonId = fixture.seasons[0].id;
    const reg = await fixture.seedEffectiveRegulation(seasonId, {
      activeFrom: '2026-08-01T00:00:00.000Z',
    });
    // Create a scheduled future regulation version due at 2026-08-15T00:00:00.000Z
    const waitingId = randomUUID();
    await fixture.database.client.regulationVersion.create({
      data: {
        id: waitingId,
        seasonId,
        caseId: reg.caseId,
        versionNumber: 2,
        preparedBy: fixture.staff.seasonManagerA,
        state: 'DRAFT',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: new Date('2026-08-15T00:00:00.000Z'),
        squadLimit: 25,
        nonHomegrownLimit: 17,
        homegrownSeasons: 3,
        homegrownMonths: 36,
        homegrownAgeStart: 15,
        homegrownAgeEnd: 21,
        u21Cutoff: new Date('2005-01-01T00:00:00.000Z'),
        clubCount: 20,
        formatCode: 'DOUBLE_ROUND_ROBIN',
        legs: 2,
        plannedMinutes: 90,
        preparationMinutes: 30,
        releaseMinutes: 30,
        winPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        qualificationCount: 4,
        relegationCount: 3,
      },
    });
    await fixture.database.client.rankingPriority.createMany({
      data: [
        { versionId: waitingId, position: 1, criterionCode: 'POINTS' },
        { versionId: waitingId, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: waitingId, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await fixture.database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: waitingId,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
      ],
    });
    await fixture.database.client.cardType.createMany({
      data: [
        {
          regulationVersionId: waitingId,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
      ],
    });
    await fixture.database.client.registrationWindow.createMany({
      data: [
        {
          regulationVersionId: waitingId,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date('2026-08-15T00:00:00.000Z'),
          closesAt: new Date('2026-08-25T00:00:00.000Z'),
        },
        {
          regulationVersionId: waitingId,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date('2026-08-15T00:00:00.000Z'),
          closesAt: new Date('2026-08-31T00:00:00.000Z'),
        },
      ],
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: waitingId },
      data: {
        state: 'APPROVED_WAITING',
        submittedAt: new Date('2026-08-10T00:00:00.000Z'),
        approvedAt: new Date('2026-08-10T01:00:00.000Z'),
        decidedAt: new Date('2026-08-10T01:00:00.000Z'),
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Chờ hiệu lực.',
      },
    });

    const execution = new BusinessExecutionService(fixture.database);
    const dependencies = new SeasonDependenciesService({
      registeredWriters: [registryRegistrationDependencyModule.writer],
      providers: registryRegistrationDependencyModule.providers,
    });
    const activation = new RegulationActivationService(dependencies, new AuditWriterService());
    fixture.clock.set(new Date('2026-08-15T00:00:01.000Z'));

    // Failing dependent write rolls back due activation
    await expect(
      execution.execute(
        {
          principal: { kind: 'session', accountId: fixture.staff.registrationOfficerA },
          locks: [],
          discover: (db) => discoverSeasonWithDueRules(db, seasonId, activation),
          authority: async () => {},
        },
        async (context) => {
          const resolved = await resolveEffectiveRegulationForWrite(context, seasonId, activation);
          expect(resolved.id).toBe(waitingId);
          throw new ApplicationError(409, 'STATE_CONFLICT', 'Simulated downstream failure');
        },
      ),
    ).rejects.toMatchObject({ status: 409 });

    const stillWaiting = await fixture.database.client.regulationVersion.findUniqueOrThrow({
      where: { id: waitingId },
      select: { state: true },
    });
    expect(stillWaiting.state).toBe('APPROVED_WAITING');

    // Succeeding dependent write commits the due activation cleanly
    const effectiveId = await execution.execute(
      {
        principal: { kind: 'session', accountId: fixture.staff.registrationOfficerA },
        locks: [],
        discover: (db) => discoverSeasonWithDueRules(db, seasonId, activation),
        authority: async () => {},
      },
      async (context) => {
        const resolved = await resolveEffectiveRegulationForWrite(context, seasonId, activation);
        return resolved.id;
      },
    );
    expect(effectiveId).toBe(waitingId);
    const nowEffective = await fixture.database.client.season.findUniqueOrThrow({
      where: { id: seasonId },
      select: { currentRegulationVersionId: true },
    });
    expect(nowEffective.currentRegulationVersionId).toBe(waitingId);
  });

  it('proves critical command replay, same-key conflict, current authorization on replay and max-3 known-rollback attempts', async () => {
    const execution = new BusinessExecutionService(fixture.database, new CommandReceiptService());
    const managerId = fixture.staff.seasonManagerB;
    const seasonId = fixture.seasons[0].id;
    const targetCaseId = randomUUID();
    const versionId = randomUUID();
    const idempotencyKey = randomUUID();
    let executions = 0;

    const runApprove = (reason: string) =>
      execution.executeCritical(
        {
          principal: { kind: 'session', accountId: managerId },
          locks: [
            { kind: 'account', key: managerId, mode: 'shared' },
            { kind: 'season', key: seasonId, mode: 'shared' },
          ],
          authority: (context) => requireSeasonManager(context, managerId, seasonId),
        },
        {
          action: 'CLUB_APPLICATION_APPROVED',
          key: idempotencyKey,
          targetId: targetCaseId,
          payload: {
            expectedRevision: '1',
            submittedVersionId: versionId,
            reason,
          },
        },
        async () => {
          executions += 1;
          return { status: 200, data: { id: targetCaseId, revision: '2', relatedId: versionId } };
        },
        async (_ctx, outcome) => outcome,
      );

    const first = await runApprove('Hồ sơ hợp lệ.');
    const replay = await runApprove('Hồ sơ hợp lệ.');
    expect(first).toEqual(replay);
    expect(executions).toBe(1);

    // Same key with changed intent payload fails with 409 IDEMPOTENCY_KEY_REUSED
    await expect(runApprove('Lý do khác.')).rejects.toMatchObject({
      status: 409,
      code: 'IDEMPOTENCY_KEY_REUSED',
    });

    // Revoking manager role causes even exact-intent replay to fail with 403 ACCESS_DENIED
    await fixture.database.client.seasonRoleAssignment.updateMany({
      where: { accountId: managerId, seasonId, revokedAt: null },
      data: { revokedAt: await fixture.database.now() },
    });
    await expect(runApprove('Hồ sơ hợp lệ.')).rejects.toMatchObject({
      status: 403,
      code: 'ACCESS_DENIED',
    });

    // At most three total attempts for known rolled-back LockSetChanged
    let attempts = 0;
    await expect(
      fixture.database.write(
        [{ kind: 'season', key: seasonId, mode: 'shared' }],
        async () => {},
        async () => {
          attempts += 1;
          throw new LockSetChanged();
        },
      ),
    ).rejects.toMatchObject({ status: 503, code: 'TRANSACTION_UNAVAILABLE' });
    expect(attempts).toBe(3);
  });
});
