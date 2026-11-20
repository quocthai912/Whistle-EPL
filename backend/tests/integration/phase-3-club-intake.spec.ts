import { randomUUID } from 'node:crypto';
import { setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 US1 — Club participation applications (BM1) intake and approval boundaries (T005/T007)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-01T00:00:00.000Z');

  it('completes BM1 draft, on-time receipt, submission and independent approval with immutable snapshot and audit', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const { club, stadium } = await fixture.seedClubAndStadium('BM1');
    const player = await fixture.seedPlayer('PL_BM1_01', 'Nguyễn Minh Quân', '2000-05-15');

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // Exact opensAt boundary (2026-08-01T00:00:00.000Z)

    // Create incomplete draft first (D059 allows incomplete drafts)
    const created = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: '  HLV   Trần   Bình  ',
      })
      .expect(201);

    const caseId = created.body.data.caseId as string;
    const versionId = created.body.data.versionId as string;
    expect(created.body.data.versionNumber).toBe(1);
    expect(created.body.data.state).toBe('DRAFT');

    // Same-case uniqueness: second open case for same club-season is rejected
    await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, { clubId: club.id })
      .expect(409);

    // Update draft with complete D059 fields and nonempty proposed players
    const patched = await fixture
      .apiRequest(officer, 'patch', `/club-applications/${caseId}/draft`, {
        versionId,
        expectedRevision: '1',
        coachName: 'HLV Trần Bình',
        homeStadiumId: stadium.id,
        representativeName: 'Lê Hoàng Nam',
        representativePhone: '+44 (20) 7946-0123',
        contactAddress: '100 Stadium Way, London',
        notes: 'Hồ sơ đầy đủ.',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 8, notes: 'Đội trưởng' }],
      })
      .expect(200);
    expect(patched.body.data.revision).toBe('2');

    // Receive exactly at opensAt -> ON_TIME
    const received = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId,
        expectedRevision: '2',
      })
      .expect(200);
    expect(received.body.data).toMatchObject({
      state: 'RECEIVED',
      receiptTimingStatus: 'ON_TIME',
      receiptRegulationVersionId: regVersionId,
    });

    // Advance clock AFTER closesAt: timely received version may still be submitted and approved!
    fixture.clock.set(new Date('2026-08-25T12:00:00.000Z'));
    const officerAfterClose = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const submitted = await fixture
      .apiRequest(officerAfterClose, 'post', `/club-applications/${caseId}/submit`, {
        versionId,
        expectedRevision: received.body.data.revision,
      })
      .expect(200);
    expect(submitted.body.data.state).toBe('PENDING_APPROVAL');

    // Submitted content is immutable (cannot PATCH)
    await fixture
      .apiRequest(officerAfterClose, 'patch', `/club-applications/${caseId}/draft`, {
        versionId,
        expectedRevision: submitted.body.data.revision,
        coachName: 'Cố sửa sau khi nộp',
      })
      .expect(409);

    // Approve independently by Season Manager with Idempotency-Key
    const key = randomUUID();
    const approved = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId,
          expectedRevision: submitted.body.data.revision,
          reason: 'Hồ sơ hợp lệ và đầy đủ theo BM1.',
        },
        key,
      )
      .expect(200);
    expect(approved.body.data.state).toBe('APPROVED');

    // Safe replay with same Idempotency-Key returns same outcome
    const replay = await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId,
          expectedRevision: submitted.body.data.revision,
          reason: 'Hồ sơ hợp lệ và đầy đủ theo BM1.',
        },
        key,
      )
      .expect(200);
    expect(replay.body.data).toEqual(approved.body.data);

    // Verify immutable official snapshot, pointer and audit
    const detail = await fixture
      .apiRequest(manager, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(detail.body.data.currentAcceptedVersionId).toBe(versionId);
    const official = detail.body.data.versions.find((v: { id: string }) => v.id === versionId);
    expect(official.officialSnapshot).toMatchObject({
      club: { id: club.id, code: 'CLB_BM1', name: 'Câu lạc bộ Kiểm thử BM1', abbreviation: 'CBM1' },
      homeStadium: { id: stadium.id, code: 'STD_BM1', name: 'Sân vận động Kiểm thử BM1' },
      coachName: 'HLV Trần Bình',
      representativeName: 'Lê Hoàng Nam',
      representativePhone: '+44 (20) 7946-0123',
      contactAddress: '100 Stadium Way, London',
    });
    expect(official.officialSnapshot.proposedPlayers).toHaveLength(1);

    const history = await fixture
      .apiRequest(officerAfterClose, 'get', `/club-applications/${caseId}/history`)
      .expect(200);
    expect(history.body.data.items.map((item: { actionCode: string }) => item.actionCode)).toEqual(
      expect.arrayContaining([
        'CLUB_APPLICATION_DRAFT_CREATED',
        'CLUB_APPLICATION_DRAFT_UPDATED',
        'CLUB_APPLICATION_RECEIVED',
        'CLUB_APPLICATION_SUBMITTED',
        'CLUB_APPLICATION_APPROVED',
      ]),
    );

    // Cannot create another initial round after approval
    await fixture
      .apiRequest(officerAfterClose, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
      })
      .expect(409);
  });

  it('supports supplementation, withdrawal, rejection, cancellation and versioned re-receipt in one case', async () => {
    const seasonId = fixture.seasons[0].id;
    await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const { club, stadium } = await fixture.seedClubAndStadium('RND');
    const player = await fixture.seedPlayer('PL_RND_01', 'Phạm Quốc Bảo', '2001-03-12');

    fixture.clock.set(new Date('2026-08-05T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const completeDraft = {
      coachName: 'HLV Nguyễn A',
      homeStadiumId: stadium.id,
      representativeName: 'Trần Đại Diện',
      representativePhone: '0901234567',
      contactAddress: '123 Đường Sân Vận Động',
      proposedPlayers: [{ playerId: player.id, shirtNumber: 10 }],
    };

    // Round 1: Draft -> Receive -> Return for supplementation (by Officer from RECEIVED)
    const r1 = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        ...completeDraft,
      })
      .expect(201);
    const caseId = r1.body.data.caseId as string;
    const v1 = r1.body.data.versionId as string;

    const r1Rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v1,
        expectedRevision: '1',
      })
      .expect(200);

    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/return`, {
        versionId: v1,
        expectedRevision: r1Rec.body.data.revision,
        reason: 'Bổ sung ghi chú danh sách cầu thủ.',
      })
      .expect(200);

    // Round 2 (same caseId!): Draft -> Receive -> Submit -> Withdraw
    const r2 = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        ...completeDraft,
        notes: 'Vòng 2',
      })
      .expect(201);
    expect(r2.body.data.caseId).toBe(caseId);
    expect(r2.body.data.versionNumber).toBe(2);
    const v2 = r2.body.data.versionId as string;

    const r2Rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v2,
        expectedRevision: '1',
      })
      .expect(200);
    const r2Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v2,
        expectedRevision: r2Rec.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/withdraw`, {
        versionId: v2,
        expectedRevision: r2Sub.body.data.revision,
        reason: 'Rút lại để kiểm tra lại thông tin.',
      })
      .expect(200);

    // Round 3: Draft -> Receive -> Submit -> Reject (independent manager)
    const r3 = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        ...completeDraft,
        notes: 'Vòng 3',
      })
      .expect(201);
    expect(r3.body.data.caseId).toBe(caseId);
    expect(r3.body.data.versionNumber).toBe(3);
    const v3 = r3.body.data.versionId as string;

    const r3Rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v3,
        expectedRevision: '1',
      })
      .expect(200);
    const r3Sub = await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v3,
        expectedRevision: r3Rec.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(manager, 'post', `/club-applications/${caseId}/reject`, {
        versionId: v3,
        expectedRevision: r3Sub.body.data.revision,
        reason: 'Không đạt tiêu chuẩn sân nhà.',
      })
      .expect(200);

    // Round 4: Draft -> Cancel before approval
    const r4 = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        ...completeDraft,
        notes: 'Vòng 4',
      })
      .expect(201);
    expect(r4.body.data.caseId).toBe(caseId);
    expect(r4.body.data.versionNumber).toBe(4);
    await fixture
      .apiRequest(officer, 'post', `/club-applications/${caseId}/cancel`, {
        versionId: r4.body.data.versionId,
        expectedRevision: '1',
        reason: 'CLB tạm hoãn nộp.',
      })
      .expect(200);

    // All 4 versions retained in the same case with exact states
    const detail = await fixture
      .apiRequest(manager, 'get', `/club-applications/${caseId}`)
      .expect(200);
    expect(
      detail.body.data.versions.map((v: { versionNumber: number; state: string }) => [
        v.versionNumber,
        v.state,
      ]),
    ).toEqual([
      [4, 'CANCELLED'],
      [3, 'REJECTED'],
      [2, 'WITHDRAWN'],
      [1, 'NEEDS_SUPPLEMENTATION'],
    ]);
  });

  it('enforces exact [open, close) window boundaries, D059 completeness, and denies former editors', async () => {
    const seasonId = fixture.seasons[0].id;
    await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const { club, stadium } = await fixture.seedClubAndStadium('EDG');
    const player = await fixture.seedPlayer('PL_EDG_01', 'Lê Văn Biên', '2000-02-02');

    // Grant seasonManagerB REGISTRATION_OFFICER too so they hold both roles in seasonId
    await fixture.database.client.seasonRoleAssignment.create({
      data: {
        accountId: fixture.staff.seasonManagerB,
        seasonId,
        roleCode: 'REGISTRATION_OFFICER',
        grantedBy: fixture.staff.admin,
        grantedAt: await fixture.database.now(),
      },
    });

    // First test inside window [open, close) (2026-08-19T23:59:59Z) and former editor denial
    fixture.clock.set(new Date('2026-08-19T23:59:59.000Z'));
    const officerInWindow = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const dualRole = await fixture.authenticate(fixture.staff.seasonManagerB);

    const r1 = await fixture
      .apiRequest(officerInWindow, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Biên',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện Biên',
        representativePhone: '0909888777',
        contactAddress: 'Địa chỉ liên hệ',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 9 }],
      })
      .expect(201);
    const caseId = r1.body.data.caseId as string;
    const v1 = r1.body.data.versionId as string;

    // dualRole edits v1 -> becomes recorded editor!
    const edited = await fixture
      .apiRequest(dualRole, 'patch', `/club-applications/${caseId}/draft`, {
        versionId: v1,
        expectedRevision: '1',
        notes: 'Chỉnh sửa bởi nhân sự kiêm nhiệm.',
      })
      .expect(200);

    const rec1 = await fixture
      .apiRequest(officerInWindow, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v1,
        expectedRevision: edited.body.data.revision,
      })
      .expect(200);
    expect(rec1.body.data.receiptTimingStatus).toBe('ON_TIME');

    const sub1 = await fixture
      .apiRequest(officerInWindow, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v1,
        expectedRevision: rec1.body.data.revision,
      })
      .expect(200);

    // Former editor (even with SEASON_MANAGER role) is DENIED approval/rejection/return!
    await fixture
      .apiRequest(
        dualRole,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId: v1,
          expectedRevision: sub1.body.data.revision,
          reason: 'Tự duyệt hồ sơ từng sửa.',
        },
        randomUUID(),
      )
      .expect(403);
    await fixture
      .apiRequest(dualRole, 'post', `/club-applications/${caseId}/reject`, {
        versionId: v1,
        expectedRevision: sub1.body.data.revision,
        reason: 'Tự từ chối hồ sơ từng sửa.',
      })
      .expect(403);
    await fixture
      .apiRequest(dualRole, 'post', `/club-applications/${caseId}/return`, {
        versionId: v1,
        expectedRevision: sub1.body.data.revision,
        reason: 'Tự trả hồ sơ từng sửa.',
      })
      .expect(403);

    // Withdraw v1, advance clock to EXACT closesAt boundary (2026-08-20T00:00:00.000Z) -> LATE + D059 incomplete!
    await fixture
      .apiRequest(officerInWindow, 'post', `/club-applications/${caseId}/withdraw`, {
        versionId: v1,
        expectedRevision: sub1.body.data.revision,
        reason: 'Rút lại để kiểm thử mốc đóng cửa.',
      })
      .expect(200);

    fixture.clock.set(new Date('2026-08-20T00:00:00.000Z')); // Exact closesAt -> LATE
    const r2 = await fixture
      .apiRequest(officerInWindow, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Biên',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện Biên',
        representativePhone: '0909888777',
      })
      .expect(201);
    const v2 = r2.body.data.versionId as string;

    const recLate = await fixture
      .apiRequest(officerInWindow, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v2,
        expectedRevision: '1',
      })
      .expect(200);
    expect(recLate.body.data.receiptTimingStatus).toBe('LATE');

    // Submit fails due to incomplete D059 fields
    await fixture
      .apiRequest(officerInWindow, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v2,
        expectedRevision: recLate.body.data.revision,
      })
      .expect(400);
  });

  it('rejects approval on D099 club/stadium discontinuation, wrong season, no effective rule and Closed season', async () => {
    const seasonA = fixture.seasons[0].id;
    const seasonB = fixture.seasons[1].id;
    const { club, stadium } = await fixture.seedClubAndStadium('D99');
    const player = await fixture.seedPlayer('PL_D99_01', 'Hoàng Văn Chính', '1999-11-11');

    fixture.clock.set(new Date('2026-08-05T10:00:00.000Z'));
    const officerA = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerA = await fixture.authenticate(fixture.staff.seasonManagerA);
    const officerB = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);

    // 1. Season with NO effective regulation rejects receive
    const noRuleDraft = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV A',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện A',
        representativePhone: '0901112223',
        contactAddress: '10 Main St',
        proposedPlayers: [{ playerId: player.id }],
      })
      .expect(201);
    const caseId = noRuleDraft.body.data.caseId as string;
    const versionId = noRuleDraft.body.data.versionId as string;

    await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/receive`, {
        versionId,
        expectedRevision: '1',
      })
      .expect(409);

    // 2. Wrong-season officer cannot read or act on Season A's application
    await fixture.apiRequest(officerB, 'get', `/club-applications/${caseId}`).expect(404);
    await fixture.apiRequest(officerB, 'get', `/seasons/${seasonA}/club-applications`).expect(404);

    // 3. Seed effective regulation, receive & submit, then discontinue home stadium (D099) before approval
    await fixture.seedEffectiveRegulation(seasonA, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const rec = await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/receive`, {
        versionId,
        expectedRevision: '1',
      })
      .expect(200);
    const sub = await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/submit`, {
        versionId,
        expectedRevision: rec.body.data.revision,
      })
      .expect(200);

    await fixture.database.client.stadium.update({
      where: { id: stadium.id },
      data: { discontinuedAt: new Date('2026-08-05T11:00:00.000Z') },
    });

    await fixture
      .apiRequest(
        managerA,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId,
          expectedRevision: sub.body.data.revision,
          reason: 'Thử duyệt khi sân đã ngừng sử dụng.',
        },
        randomUUID(),
      )
      .expect(409);

    // Resume stadium, discontinue club -> also rejected!
    await fixture.database.client.stadium.update({
      where: { id: stadium.id },
      data: { discontinuedAt: null },
    });
    await fixture.database.client.club.update({
      where: { id: club.id },
      data: { discontinuedAt: new Date('2026-08-05T11:30:00.000Z') },
    });
    await fixture
      .apiRequest(
        managerA,
        'post',
        `/club-applications/${caseId}/approve`,
        {
          versionId,
          expectedRevision: sub.body.data.revision,
          reason: 'Thử duyệt khi CLB đã ngừng sử dụng.',
        },
        randomUUID(),
      )
      .expect(409);

    // 4. Closed season rejects BM1 writes
    await fixture.database.client.season.update({
      where: { id: seasonB },
      data: { state: 'CLOSED' },
    });
    await fixture
      .apiRequest(officerB, 'post', `/seasons/${seasonB}/club-applications`, { clubId: club.id })
      .expect(409);
  });
});
