import { randomUUID } from 'node:crypto';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { setupPhase3HttpFixture, type Phase3AuthTokens } from './phase-3-fixtures';

describe('PHASE 3 US5 — D100 controlled BM1 corrections (T019/T020)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-05T10:00:00.000Z');

  async function seedApprovedBm1(options?: { suffix?: string }) {
    const suffix = options?.suffix ?? 'D100';
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const { club, stadium: stadium1 } = await fixture.seedClubAndStadium(`${suffix}1`);
    const { stadium: stadium2 } = await fixture.seedClubAndStadium(`${suffix}2`);
    const player = await fixture.seedPlayer(`PL_${suffix}_01`, 'Nguyễn Văn Hùng', '2000-04-10');

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const created = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Ban Đầu',
        homeStadiumId: stadium1.id,
        representativeName: 'Trần Đại Diện Gốc',
        representativePhone: '0901234567',
        contactAddress: '10 Đường Cũ, TP.HCM',
        notes: 'Ghi chú ban đầu',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 9, notes: 'Tiền đạo' }],
      })
      .expect(201);
    const caseId = created.body.data.caseId as string;
    const v1Id = created.body.data.versionId as string;

    const rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v1Id,
        expectedRevision: '1',
      })
      .expect(200);
    const sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v1Id,
        expectedRevision: rec.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId: v1Id,
          expectedRevision: sub.body.data.revision,
          reason: 'Phê duyệt hồ sơ tham dự ban đầu.',
        },
        randomUUID(),
      )
      .expect(200);

    return {
      seasonId,
      regVersionId,
      club,
      stadium1,
      stadium2,
      player,
      caseId,
      v1Id,
    };
  }

  async function seedExistingRegistration(seasonId: string, clubId: string, playerId: string) {
    const regId = randomUUID();
    const regVerId = randomUUID();
    const now = await fixture.database.now();
    await fixture.database.client.playerRegistration.create({
      data: {
        id: regId,
        seasonId,
        clubId,
        playerId,
        createdAt: now,
        updatedAt: now,
      },
    });
    await fixture.database.client.registrationVersion.create({
      data: {
        id: regVerId,
        seasonId,
        caseId: regId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'VALID',
        shirtNumber: 9,
        playingStart: new Date('2026-08-15T00:00:00.000Z'),
        playingEnd: null,
        u21Finding: false,
        homegrownFinding: false,
        playingDisposition: 'ACTIVE',
        createdAt: now,
      },
    });
    await fixture.database.client.playerRegistration.update({
      where: { id: regId },
      data: { currentValidatedVersionId: regVerId },
    });
    return { regId, regVerId };
  }

  async function approveReopenSeason(
    seasonId: string,
    proposer: Phase3AuthTokens,
    approver: Phase3AuthTokens,
  ) {
    const created = await fixture
      .apiRequest(proposer, 'post', `/seasons/${seasonId}/lifecycle-requests`, {
        action: 'REOPEN',
        reason: 'Mở lại mùa giải hợp lệ để đính chính hồ sơ BM1.',
      })
      .expect(201);
    const requestId = created.body.data.id as string;
    const versionId = created.body.data.relatedId as string;

    const submitted = await fixture
      .apiRequest(proposer, 'post', `/season-lifecycle-requests/${requestId}/submit`, {
        submittedVersionId: versionId,
        expectedRevision: created.body.data.revision,
        reason: 'Trình duyệt mở lại mùa giải.',
      })
      .expect(200);

    await fixture
      .apiRequest(
        approver,
        'post',
        `/season-lifecycle-requests/${requestId}/approve`,
        {
          submittedVersionId: versionId,
          expectedRevision: submitted.body.data.revision,
          reason: 'Phê duyệt mở lại mùa giải theo D074.',
        },
        randomUUID(),
      )
      .expect(200);
  }

  it('approves D100 correction while Open outside intake without D053 exception, preserving original receipt, v1 snapshot and sporting records', async () => {
    const { seasonId, regVersionId, club, stadium1, stadium2, player, caseId, v1Id } =
      await seedApprovedBm1({ suffix: 'OPEN' });
    const { regId, regVerId } = await seedExistingRegistration(seasonId, club.id, player.id);

    const v1Before = await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
      where: { id: v1Id },
    });
    const regBefore = await fixture.database.client.registrationVersion.findUniqueOrThrow({
      where: { id: regVerId },
    });

    // Advance clock well outside BM1 intake window [2026-08-01, 2026-08-20) — no D053 exception!
    fixture.clock.set(new Date('2026-09-15T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const proposed = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        correctionKind: 'ORIGINAL_RECORDING_ERROR',
        coachName: 'HLV Đính Chính Đúng',
        homeStadiumId: stadium2.id,
        representativePhone: '+84 90 999 8888',
        correctionReason: 'Ghi sai tên HLV và sân nhà khi nhập liệu từ bản gốc BM1.',
        correctionEvidence: 'Công văn đính chính số 42/CV-CLB kèm bản scan BM1 gốc có dấu.',
        affectedReferences: [
          {
            kind: 'SCHEDULED_MATCH',
            referenceId: null,
            note: 'Cần rà soát địa điểm thi đấu các trận sân nhà theo UC14.',
          },
        ],
      })
      .expect(201);

    const v2Id = proposed.body.data.versionId as string;
    expect(proposed.body.data.versionNumber).toBe(2);
    expect(proposed.body.data.versionKind).toBe('CORRECTION');
    expect(proposed.body.data.baseAcceptedVersionId).toBe(v1Id);
    expect(proposed.body.data.state).toBe('DRAFT');

    // Existing official version remains current while correction is DRAFT
    const detailWhileDraft = await fixture
      .apiRequest(officer, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detailWhileDraft.body.data.currentAcceptedVersionId).toBe(v1Id);

    // Edit another descriptive field (notes) without resending homeStadiumId (exercises D099 stadium lock discovery)
    const editedDraft = await fixture
      .apiRequest(officer, 'patch', `/club-applications/${caseId}/corrections/${v2Id}`, {
        expectedRevision: proposed.body.data.revision,
        notes: 'Đã bổ sung kiểm tra đối chiếu công văn gốc.',
      })
      .expect(200);

    // Submit correction
    const submitted = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: editedDraft.body.data.revision,
      })
      .expect(200);
    expect(submitted.body.data.state).toBe('PENDING_APPROVAL');

    // Existing official version still remains current while PENDING_APPROVAL
    const detailWhilePending = await fixture
      .apiRequest(manager, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detailWhilePending.body.data.currentAcceptedVersionId).toBe(v1Id);

    // Approve independently outside intake window with Idempotency-Key
    const idempotencyKey = randomUUID();
    const approved = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Đã đối chiếu bản gốc BM1, chấp thuận đính chính theo D100.',
        },
        idempotencyKey,
      )
      .expect(200);
    expect(approved.body.data.state).toBe('APPROVED');
    expect(approved.body.data.versionId).toBe(v2Id);

    // Safe replay with same Idempotency-Key returns identical result
    const replay = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Đã đối chiếu bản gốc BM1, chấp thuận đính chính theo D100.',
        },
        idempotencyKey,
      )
      .expect(200);
    expect(replay.body.data).toEqual(approved.body.data);

    // Same Idempotency-Key with different payload is rejected
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Lý do khác để kiểm tra xung đột khóa.',
        },
        idempotencyKey,
      )
      .expect(409);

    // Verify new official pointer, preserved original receipt, own decision time, and affected references
    const detailAfter = await fixture
      .apiRequest(manager, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detailAfter.body.data.currentAcceptedVersionId).toBe(v2Id);

    const v2 = detailAfter.body.data.versions.find((v: { id: string }) => v.id === v2Id);
    expect(v2).toMatchObject({
      versionKind: 'CORRECTION',
      baseAcceptedVersionId: v1Id,
      predecessorVersionId: v1Id,
      state: 'APPROVED',
      coachName: 'HLV Đính Chính Đúng',
      homeStadiumId: stadium2.id,
      representativePhone: '+84 90 999 8888',
      receivedAt: v1Before.receivedAt!.toISOString(),
      receiptRegulationVersionId: regVersionId,
      receiptTimingStatus: 'ON_TIME',
      decidedAt: '2026-09-15T10:00:00.000Z',
    });
    expect(v2.proposedPlayers).toHaveLength(1);
    expect(v2.proposedPlayers[0].playerId).toBe(player.id);
    expect(v2.affectedReferences).toMatchObject({
      venueReviewRequired: true,
      discoveredRegistrationIds: [regId],
    });
    expect(v2.officialSnapshot).toMatchObject({
      baseAcceptedVersionId: v1Id,
      coachName: 'HLV Đính Chính Đúng',
      homeStadium: { id: stadium2.id },
      receivedAt: v1Before.receivedAt!.toISOString(),
      approvedAt: '2026-09-15T10:00:00.000Z',
    });

    // Verify v1 row and existing sporting/registration record are completely unchanged
    const v1After = await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
      where: { id: v1Id },
    });
    expect(v1After.state).toBe('APPROVED');
    expect(v1After.coachName).toBe('HLV Ban Đầu');
    expect(v1After.homeStadiumId).toBe(stadium1.id);
    expect(v1After.receivedAt?.toISOString()).toBe(v1Before.receivedAt?.toISOString());
    expect(v1After.decidedAt?.toISOString()).toBe(v1Before.decidedAt?.toISOString());
    expect(v1After.officialSnapshot).toEqual(v1Before.officialSnapshot);

    const regAfter = await fixture.database.client.registrationVersion.findUniqueOrThrow({
      where: { id: regVerId },
    });
    expect(regAfter).toEqual(regBefore);

    // Verify audit history recorded correction lifecycle
    const history = await fixture
      .apiRequest(officer, 'get', `/club-applications/${caseId}/history`)
      .expect(200);
    expect(history.body.data.items.map((item: { actionCode: string }) => item.actionCode)).toEqual(
      expect.arrayContaining([
        'CLUB_APPLICATION_CORRECTION_DRAFT_CREATED',
        'CLUB_APPLICATION_CORRECTION_SUBMITTED',
        'CLUB_APPLICATION_CORRECTION_APPROVED',
      ]),
    );
  });

  it('denies D100 corrections while season is Closed and allows them after lawful D074 reopening', async () => {
    const { seasonId, caseId, v1Id } = await seedApprovedBm1({ suffix: 'REOP' });

    // Advance clock outside intake window and close the season
    fixture.clock.set(new Date('2026-09-20T10:00:00.000Z'));
    await fixture.database.client.season.update({
      where: { id: seasonId },
      data: { state: 'CLOSED' },
    });

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerA = await fixture.authenticate(fixture.staff.seasonManagerA);
    const managerB = await fixture.authenticate(fixture.staff.seasonManagerB);

    // Closed season denies proposing a D100 correction
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Khi Đóng Mùa',
        correctionReason: 'Thử đính chính khi mùa giải đã đóng.',
        correctionEvidence: 'Biên bản đính chính số 01.',
      })
      .expect(409);

    // Lawfully reopen the season via D074 independent SeasonLifecycle approval
    await approveReopenSeason(seasonId, managerA, managerB);

    // Now propose, submit, and approve D100 correction while Open (still outside intake)
    const proposed = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Sau Mở Lại',
        correctionReason: 'Đính chính lỗi ghi chép sau khi mở lại mùa giải hợp lệ.',
        correctionEvidence: 'Biên bản kiểm tra hồ sơ BM1 gốc.',
      })
      .expect(201);
    const v2Id = proposed.body.data.versionId as string;

    const submitted = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: proposed.body.data.revision,
      })
      .expect(200);

    // Close season again right before approval -> approval must be denied!
    await fixture.database.client.season.update({
      where: { id: seasonId },
      data: { state: 'CLOSED' },
    });
    await fixture
      .apiRequest(
        managerA,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Thử duyệt khi mùa giải bị đóng.',
        },
        randomUUID(),
      )
      .expect(409);

    // Reopen lawfully again and approve
    await approveReopenSeason(seasonId, managerB, managerA);
    const approved = await fixture
      .apiRequest(
        managerA,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Chấp thuận đính chính sau khi mở lại mùa giải.',
        },
        randomUUID(),
      )
      .expect(200);
    expect(approved.body.data.state).toBe('APPROVED');

    const detail = await fixture
      .apiRequest(managerA, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detail.body.data.currentAcceptedVersionId).toBe(v2Id);
  });

  it('rejects stale accepted baseline at proposal and at final approval without altering current official version', async () => {
    const { caseId, v1Id } = await seedApprovedBm1({ suffix: 'STAL' });

    fixture.clock.set(new Date('2026-09-10T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    // First correction v2 (based on v1) -> approve so currentAcceptedVersionId becomes v2
    const c1 = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Đính Chính Lần 1',
        correctionReason: 'Đính chính lần 1.',
        correctionEvidence: 'Bản gốc BM1 lần 1.',
      })
      .expect(201);
    const v2Id = c1.body.data.versionId as string;

    const c1Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: c1.body.data.revision,
      })
      .expect(200);

    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: c1Sub.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Phê duyệt lần 1.',
        },
        randomUUID(),
      )
      .expect(200);

    // Proposing a new correction against stale v1 is rejected with 409 BASIS_CHANGED
    const staleProposal = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Trên Cơ Sở Cũ',
        correctionReason: 'Thử đính chính trên v1 đã cũ.',
        correctionEvidence: 'Bản gốc BM1.',
      })
      .expect(409);
    expect(staleProposal.body.error.code).toBe('BASIS_CHANGED');

    // Propose v3 against current v2 and submit it, then verify mismatched baseAcceptedVersionId at approve is rejected
    const c2 = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v2Id,
        contactAddress: '99 Đường Mới Đính Chính',
        correctionReason: 'Đính chính địa chỉ liên hệ.',
        correctionEvidence: 'Công văn đính chính địa chỉ.',
      })
      .expect(201);
    const v3Id = c2.body.data.versionId as string;

    const c2Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v3Id}/submit`, {
        expectedRevision: c2.body.data.revision,
      })
      .expect(200);

    // Wrong/stale baseAcceptedVersionId in approve body -> rejected
    const wrongBaseApprove = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v3Id}/approve`,
        {
          expectedRevision: c2Sub.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Duyệt với cơ sở cũ.',
        },
        randomUUID(),
      )
      .expect(409);
    expect(wrongBaseApprove.body.error.code).toBe('BASIS_CHANGED');

    // Simulate concurrent advance of currentAcceptedVersionId to another approved version before v3 approval
    const v4Id = randomUUID();
    const now = await fixture.database.now();
    await fixture.database.client.clubApplicationVersion.create({
      data: {
        id: v4Id,
        seasonId: fixture.seasons[0].id,
        caseId,
        versionNumber: 4,
        versionKind: 'CORRECTION',
        preparedBy: fixture.staff.registrationOfficerB,
        predecessorVersionId: v2Id,
        baseAcceptedVersionId: v2Id,
        state: 'APPROVED',
        coachName: 'HLV Đã Cập Nhật Đồng Thời',
        homeStadiumId: (
          await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
            where: { id: v2Id },
            select: { homeStadiumId: true },
          })
        ).homeStadiumId,
        representativeName: 'Trần Đại Diện Gốc',
        representativePhone: '0901234567',
        contactAddress: '10 Đường Cũ, TP.HCM',
        decidedAt: now,
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Cập nhật đồng thời.',
        createdAt: now,
      },
    });
    await fixture.database.client.clubApplication.update({
      where: { id: caseId },
      data: { currentAcceptedVersionId: v4Id },
    });

    const staleApprove = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v3Id}/approve`,
        {
          expectedRevision: c2Sub.body.data.revision,
          baseAcceptedVersionId: v2Id,
          reason: 'Thử duyệt v3 khi cơ sở v2 đã cũ.',
        },
        randomUUID(),
      )
      .expect(409);
    expect(staleApprove.body.error.code).toBe('BASIS_CHANGED');

    // Official pointer remains v4Id
    const appRow = await fixture.database.client.clubApplication.findUniqueOrThrow({
      where: { id: caseId },
    });
    expect(appRow.currentAcceptedVersionId).toBe(v4Id);
  });

  it('denies former editors even with dual roles and retains official version on return, reject, withdraw and cancel', async () => {
    const { seasonId, caseId, v1Id } = await seedApprovedBm1({ suffix: 'EDIT' });

    // Grant seasonManagerA an additional REGISTRATION_OFFICER role so they can edit a draft
    await fixture.database.client.seasonRoleAssignment.create({
      data: {
        accountId: fixture.staff.seasonManagerA,
        seasonId,
        roleCode: 'REGISTRATION_OFFICER',
        grantedBy: fixture.staff.admin,
        grantedAt: await fixture.database.now(),
      },
    });

    fixture.clock.set(new Date('2026-09-12T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const dualRoleManagerA = await fixture.authenticate(fixture.staff.seasonManagerA);
    const independentManagerB = await fixture.authenticate(fixture.staff.seasonManagerB);

    const draft = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Nháp 1',
        correctionReason: 'Sửa tên HLV.',
        correctionEvidence: 'Văn bản đính chính gốc.',
      })
      .expect(201);
    const v2Id = draft.body.data.versionId as string;

    // dualRoleManagerA edits the draft -> recorded permanently as former editor
    const edited = await fixture
      .apiRequest(dualRoleManagerA, 'patch', `/club-applications/${caseId}/corrections/${v2Id}`, {
        expectedRevision: draft.body.data.revision,
        coachName: 'HLV Nháp 2',
      })
      .expect(200);

    const submitted = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: edited.body.data.revision,
      })
      .expect(200);

    // Former editor is denied approve, return, and reject
    await fixture
      .apiRequest(
        dualRoleManagerA,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Tự duyệt bản từng chỉnh sửa.',
        },
        randomUUID(),
      )
      .expect(403);

    await fixture
      .apiRequest(
        dualRoleManagerA,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/return`,
        {
          expectedRevision: submitted.body.data.revision,
          reason: 'Tự trả lại bản từng chỉnh sửa.',
        },
      )
      .expect(403);

    await fixture
      .apiRequest(
        dualRoleManagerA,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/reject`,
        {
          expectedRevision: submitted.body.data.revision,
          reason: 'Tự từ chối bản từng chỉnh sửa.',
        },
      )
      .expect(403);

    // Independent manager B returns v2 for supplementation -> v1 stays official
    const returned = await fixture
      .apiRequest(
        independentManagerB,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/return`,
        {
          expectedRevision: submitted.body.data.revision,
          reason: 'Cần bổ sung số hiệu công văn.',
        },
      )
      .expect(200);
    expect(returned.body.data.state).toBe('NEEDS_SUPPLEMENTATION');

    // Officer proposes v3 (successor after return), submits, and manager B rejects -> v1 still official
    const v3Draft = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Nháp 3',
        correctionReason: 'Bổ sung số hiệu công văn.',
        correctionEvidence: 'Công văn số 88/BM1.',
      })
      .expect(201);
    expect(v3Draft.body.data.predecessorVersionId).toBe(v2Id);
    const v3Id = v3Draft.body.data.versionId as string;

    const v3Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v3Id}/submit`, {
        expectedRevision: v3Draft.body.data.revision,
      })
      .expect(200);

    const rejected = await fixture
      .apiRequest(
        independentManagerB,
        'post',
        `/club-applications/${caseId}/corrections/${v3Id}/reject`,
        {
          expectedRevision: v3Sub.body.data.revision,
          reason: 'Bằng chứng chưa thuyết phục.',
        },
      )
      .expect(200);
    expect(rejected.body.data.state).toBe('REJECTED');

    // Officer proposes v4, submits, then withdraws -> v1 still official
    const v4Draft = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Nháp 4',
        correctionReason: 'Đính chính lần 4.',
        correctionEvidence: 'Công văn số 89/BM1.',
      })
      .expect(201);
    const v4Id = v4Draft.body.data.versionId as string;

    const v4Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v4Id}/submit`, {
        expectedRevision: v4Draft.body.data.revision,
      })
      .expect(200);

    const withdrawn = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v4Id}/withdraw`, {
        expectedRevision: v4Sub.body.data.revision,
        reason: 'Rút lại để kiểm tra thêm.',
      })
      .expect(200);
    expect(withdrawn.body.data.state).toBe('WITHDRAWN');

    // Officer proposes v5, then cancels while DRAFT -> v1 still official
    const v5Draft = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Nháp 5',
        correctionReason: 'Đính chính lần 5.',
        correctionEvidence: 'Công văn số 90/BM1.',
      })
      .expect(201);
    const v5Id = v5Draft.body.data.versionId as string;

    const cancelled = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v5Id}/cancel`, {
        expectedRevision: v5Draft.body.data.revision,
        reason: 'Hủy đề xuất đính chính không cần thiết.',
      })
      .expect(200);
    expect(cancelled.body.data.state).toBe('CANCELLED');

    // Verify v1 is still currentAcceptedVersionId
    const detail = await fixture
      .apiRequest(independentManagerB, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detail.body.data.currentAcceptedVersionId).toBe(v1Id);
  });

  it('rejects prohibited roster/later-change corrections, no-op edits, D099 discontinued new stadium, and unauthorized access', async () => {
    const { caseId, v1Id, stadium2, player } = await seedApprovedBm1({ suffix: 'SCOP' });

    fixture.clock.set(new Date('2026-09-12T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const wrongSeasonOfficer = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);
    const unprivileged = await fixture.authenticate(fixture.staff.unprivilegedUser);

    // 1. Prohibited proposedPlayers change -> 400 VALIDATION_FAILED
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Hợp Lệ',
        correctionReason: 'Thử đổi danh sách cầu thủ.',
        correctionEvidence: 'Bằng chứng.',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 10 }],
      })
      .expect(400);

    // 2. Prohibited later-change-in-circumstances / club replacement -> 400 INVALID_INPUT
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        correctionKind: 'LATER_CIRCUMSTANCE_CHANGE',
        coachName: 'HLV Thay Đổi Sau Này',
        correctionReason: 'CLB bổ nhiệm HLV mới giữa mùa.',
        correctionEvidence: 'Quyết định bổ nhiệm mới.',
      })
      .expect(400);

    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        correctionKind: 'CLUB_WITHDRAWAL_OR_REPLACEMENT',
        coachName: 'HLV CLB Thay Thế',
        correctionReason: 'Thay CLB.',
        correctionEvidence: 'Công văn.',
      })
      .expect(400);

    // 3. No-op correction (no descriptive field differs from baseline) -> 400
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Ban Đầu',
        correctionReason: 'Không có thay đổi thực tế.',
        correctionEvidence: 'Bằng chứng.',
      })
      .expect(400);

    // 3b. Null on non-nullable fields returns 400 VALIDATION_FAILED (not 500)
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        homeStadiumId: null,
        correctionReason: 'Thử xóa sân nhà.',
        correctionEvidence: 'Bằng chứng.',
      })
      .expect(400);

    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        correctionKind: null,
        coachName: 'HLV Test Null',
        correctionReason: 'Thử gửi correctionKind null.',
        correctionEvidence: 'Bằng chứng.',
      })
      .expect(400);

    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Test Null',
        correctionReason: 'Thử gửi affectedReferences null.',
        correctionEvidence: 'Bằng chứng.',
        affectedReferences: null,
      })
      .expect(400);

    // 4. D099 discontinued new home stadium -> 409 MASTER_DISCONTINUED
    await fixture.database.client.stadium.update({
      where: { id: stadium2.id },
      data: { discontinuedAt: new Date('2026-09-01T00:00:00.000Z') },
    });
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        homeStadiumId: stadium2.id,
        correctionReason: 'Đổi sang sân đã ngừng sử dụng.',
        correctionEvidence: 'Biên bản đính chính.',
      })
      .expect(409);

    // 5. Wrong-season officer and unprivileged user denied
    await fixture
      .apiRequest(wrongSeasonOfficer, 'get', `/club-applications/${caseId}/corrections`)
      .expect(404);
    await fixture
      .apiRequest(wrongSeasonOfficer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Sai Mùa',
        correctionReason: 'Sai mùa.',
        correctionEvidence: 'Bằng chứng.',
      })
      .expect(403);
    await fixture
      .apiRequest(unprivileged, 'get', `/club-applications/${caseId}/corrections`)
      .expect(404);
  });

  it('rolls back atomically when approval fails before commit/audit and preserves previous official state', async () => {
    const { caseId, v1Id } = await seedApprovedBm1({ suffix: 'ROLL' });

    fixture.clock.set(new Date('2026-09-14T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const draft = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        representativeName: 'Nguyễn Đại Diện Đúng',
        correctionReason: 'Sửa lỗi chính tả tên người đại diện.',
        correctionEvidence: 'Bản scan BM1 gốc có xác nhận.',
      })
      .expect(201);
    const v2Id = draft.body.data.versionId as string;

    const submitted = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: draft.body.data.revision,
      })
      .expect(200);

    const idempotencyKey = randomUUID();
    const originalAppend = AuditWriterService.prototype.append;
    const spy = jest
      .spyOn(AuditWriterService.prototype, 'append')
      .mockImplementationOnce(async function (this: AuditWriterService, ctx, event) {
        if (event.action === 'CLUB_APPLICATION_CORRECTION_APPROVED') {
          throw new Error('Injected audit failure to verify atomic rollback');
        }
        return originalAppend.call(this, ctx, event);
      });

    try {
      await fixture
        .apiRequest(
          manager,
          'post',
          `/club-applications/${caseId}/corrections/${v2Id}/approve`,
          {
            expectedRevision: submitted.body.data.revision,
            baseAcceptedVersionId: v1Id,
            reason: 'Duyệt đính chính nhưng gặp lỗi ghi nhật ký.',
          },
          idempotencyKey,
        )
        .expect(500);
    } finally {
      spy.mockRestore();
    }

    // Independent committed-state read: v1 is still currentAcceptedVersionId, v2 is still PENDING_APPROVAL
    const appAfterFailure = await fixture.database.client.clubApplication.findUniqueOrThrow({
      where: { id: caseId },
    });
    expect(appAfterFailure.currentAcceptedVersionId).toBe(v1Id);

    const v2AfterFailure = await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
      where: { id: v2Id },
    });
    expect(v2AfterFailure.state).toBe('PENDING_APPROVAL');
    expect(v2AfterFailure.decidedAt).toBeNull();
    expect(v2AfterFailure.officialSnapshot).toBeNull();

    const failedAuditCount = await fixture.database.client.auditRecord.count({
      where: { objectId: caseId, actionCode: 'CLUB_APPLICATION_CORRECTION_APPROVED' },
    });
    expect(failedAuditCount).toBe(0);

    // Retry with same Idempotency-Key now succeeds cleanly
    const approved = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Duyệt đính chính nhưng gặp lỗi ghi nhật ký.',
        },
        idempotencyKey,
      )
      .expect(200);
    expect(approved.body.data.state).toBe('APPROVED');
  });

  it('carries forward accepted snapshots, originalApprovedAt and receiptExceptionVersionId across chained D100 corrections and blocks D053 exceptions on CORRECTION versions', async () => {
    const seasonId = fixture.seasons[0].id;
    await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-03T00:00:00.000Z' },
    });
    const { club, stadium: stadium1 } = await fixture.seedClubAndStadium('CHN1');
    const player = await fixture.seedPlayer('PL_CHN_01', 'Lê Minh Khôi', '2000-02-02');

    // Receive v1 LATE (2026-08-05 > closesAt 2026-08-03) and approve via D053 receipt exception
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const created = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Gốc Muộn',
        homeStadiumId: stadium1.id,
        representativeName: 'Đại Diện Gốc',
        representativePhone: '0901112233',
        contactAddress: '10 Đường Gốc',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 7 }],
      })
      .expect(201);
    const caseId = created.body.data.caseId as string;
    const v1Id = created.body.data.versionId as string;

    const rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v1Id,
        expectedRevision: '1',
      })
      .expect(200);
    expect(rec.body.data.receiptTimingStatus).toBe('LATE');

    const exDraft = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1Id,
        reason: 'Ngoại lệ tiếp nhận muộn cho v1.',
        basis: 'Công văn chấp thuận gia hạn số 09.',
      })
      .expect(201);
    const exCaseId = exDraft.body.data.caseId as string;
    const exVersionId = exDraft.body.data.versionId as string;

    await fixture
      .apiRequest(
        manager,
        'post',
        `/receipt-exceptions/${exCaseId}/approve`,
        {
          versionId: exVersionId,
          expectedRevision: exDraft.body.data.revision,
          reason: 'Chấp thuận ngoại lệ tiếp nhận cho v1.',
        },
        randomUUID(),
      )
      .expect(200);

    const sub1 = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v1Id,
        expectedRevision: rec.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId: v1Id,
          expectedRevision: sub1.body.data.revision,
          reason: 'Phê duyệt v1 kèm ngoại lệ D053.',
        },
        randomUUID(),
      )
      .expect(200);
    const v1ApprovedAt = (
      await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
        where: { id: v1Id },
        select: { decidedAt: true },
      })
    ).decidedAt!.toISOString();

    // Mutate live Club, Stadium and Player names AFTER v1 approval to verify D100 carries forward accepted snapshots
    await fixture.database.client.club.update({
      where: { id: club.id },
      data: { name: 'CLB Đổi Tên Sau Duyệt' },
    });
    await fixture.database.client.stadium.update({
      where: { id: stadium1.id },
      data: { name: 'Sân Đổi Tên Sau Duyệt' },
    });
    await fixture.database.client.player.update({
      where: { id: player.id },
      data: { fullName: 'Cầu Thủ Đổi Tên Sau Duyệt' },
    });

    // First D100 correction v2 at a later timestamp
    fixture.clock.set(new Date('2026-09-01T10:00:00.000Z'));
    const officerLater = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerLater = await fixture.authenticate(fixture.staff.seasonManagerA);

    const c2 = await fixture
      .apiRequest(officerLater, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v1Id,
        coachName: 'HLV Đính Chính V2',
        correctionReason: 'Đính chính HLV lần 1.',
        correctionEvidence: 'Bản gốc BM1.',
        affectedReferences: [],
      })
      .expect(201);
    const v2Id = c2.body.data.versionId as string;

    const c2Sub = await fixture
      .apiRequest(officerLater, 'post', `/club-applications/${caseId}/corrections/${v2Id}/submit`, {
        expectedRevision: c2.body.data.revision,
      })
      .expect(200);

    // D053 receipt exception targeting a CORRECTION version must be rejected (409)
    await fixture
      .apiRequest(officerLater, 'post', `/seasons/${seasonId}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v2Id,
        reason: 'Thử tạo ngoại lệ D053 cho phiên bản đính chính.',
        basis: 'Không hợp lệ.',
      })
      .expect(409);

    await fixture
      .apiRequest(
        managerLater,
        'post',
        `/club-applications/${caseId}/corrections/${v2Id}/approve`,
        {
          expectedRevision: c2Sub.body.data.revision,
          baseAcceptedVersionId: v1Id,
          reason: 'Phê duyệt đính chính v2.',
        },
        randomUUID(),
      )
      .expect(200);

    // Second chained D100 correction v3 based on v2 at an even later timestamp
    fixture.clock.set(new Date('2026-09-10T10:00:00.000Z'));
    const officerV3 = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerV3 = await fixture.authenticate(fixture.staff.seasonManagerA);

    const c3 = await fixture
      .apiRequest(officerV3, 'post', `/club-applications/${caseId}/corrections`, {
        baseAcceptedVersionId: v2Id,
        representativeName: 'Đại Diện Đính Chính V3',
        correctionReason: 'Đính chính người đại diện lần 2.',
        correctionEvidence: 'Bản gốc BM1 xác nhận lần 2.',
      })
      .expect(201);
    const v3Id = c3.body.data.versionId as string;

    const c3Sub = await fixture
      .apiRequest(officerV3, 'post', `/club-applications/${caseId}/corrections/${v3Id}/submit`, {
        expectedRevision: c3.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(
        managerV3,
        'post',
        `/club-applications/${caseId}/corrections/${v3Id}/approve`,
        {
          expectedRevision: c3Sub.body.data.revision,
          baseAcceptedVersionId: v2Id,
          reason: 'Phê duyệt đính chính v3.',
        },
        randomUUID(),
      )
      .expect(200);

    const v3 = await fixture.database.client.clubApplicationVersion.findUniqueOrThrow({
      where: { id: v3Id },
      select: { officialSnapshot: true },
    });
    expect(v3.officialSnapshot).toMatchObject({
      baseAcceptedVersionId: v2Id,
      originalApprovedAt: v1ApprovedAt,
      receiptExceptionVersionId: exVersionId,
      club: { name: 'Câu lạc bộ Kiểm thử CHN1' },
      homeStadium: { name: 'Sân vận động Kiểm thử CHN1' },
      proposedPlayers: [{ playerId: player.id, fullName: 'Lê Minh Khôi' }],
    });
  });
});
