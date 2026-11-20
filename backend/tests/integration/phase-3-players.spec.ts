import { randomUUID } from 'node:crypto';
import { setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 US2 — Shared Player profile management and D036 correction (T009)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-10T10:00:00.000Z');

  const samplePlayer = {
    code: ' 007_pl ',
    fullName: '  Nguyễn   Quang   Hải  ',
    birthDate: '1997-04-12',
    nationalityCode: 'VN',
    positionCode: 'CAM',
  };

  it('enforces explicit PLAYER_MASTER grant (no implicit admin/seasonal/club/stadium write rights) and scoped read access', async () => {
    const admin = await fixture.authenticate(fixture.staff.admin);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const stadiumGrantee = await fixture.authenticate(fixture.staff.stadiumMasterGrantee);
    const unprivileged = await fixture.authenticate(fixture.staff.unprivilegedUser);
    const playerGrantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);

    for (const actor of [admin, manager, officer, stadiumGrantee, unprivileged]) {
      await fixture.apiRequest(actor, 'post', '/players', samplePlayer).expect(403);
    }
    expect(await fixture.database.client.player.count()).toBe(0);

    // Unprivileged cannot read players or catalogs
    await fixture.apiRequest(unprivileged, 'get', '/players').expect(403);
    await fixture.apiRequest(unprivileged, 'get', '/players/catalogs').expect(403);

    // Authorized grantee creates player; officer and manager can read it (read-only)
    const created = await fixture
      .apiRequest(playerGrantee, 'post', '/players', samplePlayer)
      .expect(201);
    const playerId = created.body.data.id as string;

    const readByOfficer = await fixture
      .apiRequest(officer, 'get', `/players/${playerId}`)
      .expect(200);
    expect(readByOfficer.body.data.capabilities.canEdit).toBe(false);
    expect(readByOfficer.body.data).not.toHaveProperty('clubId');
    expect(readByOfficer.body.data).not.toHaveProperty('shirtNumber');

    const readByManager = await fixture.apiRequest(manager, 'get', '/players').expect(200);
    expect(readByManager.body.data.capabilities.canEdit).toBe(false);
    expect(readByManager.body.meta.total).toBe(1);

    const catalogs = await fixture.apiRequest(officer, 'get', '/players/catalogs').expect(200);
    expect(catalogs.body.data.positions).toHaveLength(13);
    expect(catalogs.body.data.nationalities).toHaveLength(253);
  });

  it('enforces D092 stable uppercase codes, approved catalogs, Vietnam calendar birthDate and rejects Club/shirt master fields', async () => {
    const grantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);

    // Reject clubId / shirtNumber master fields (must belong to seasonal registration only)
    await fixture
      .apiRequest(grantee, 'post', '/players', { ...samplePlayer, clubId: randomUUID() })
      .expect(400);
    await fixture
      .apiRequest(grantee, 'post', '/players', { ...samplePlayer, shirtNumber: 10 })
      .expect(400);

    // Reject unapproved position / nationality codes
    await fixture
      .apiRequest(grantee, 'post', '/players', { ...samplePlayer, positionCode: 'DF' })
      .expect(400);
    await fixture
      .apiRequest(grantee, 'post', '/players', { ...samplePlayer, nationalityCode: 'ZZZ' })
      .expect(400);

    // Vietnam UTC+7 calendar birthDate boundary:
    // At 2026-08-10T18:00:00Z, Vietnam local date is 2026-08-11 01:00 -> 2026-08-11 is valid, 2026-08-12 is rejected!
    fixture.clock.set(new Date('2026-08-10T18:00:00.000Z'));
    const granteeLate = await fixture.authenticate(fixture.staff.playerMasterGrantee);

    await fixture
      .apiRequest(granteeLate, 'post', '/players', {
        ...samplePlayer,
        code: 'VN_FUTURE',
        birthDate: '2026-08-12',
      })
      .expect(400);

    const boundaryValid = await fixture
      .apiRequest(granteeLate, 'post', '/players', {
        ...samplePlayer,
        code: '007_vn_today',
        birthDate: '2026-08-11',
      })
      .expect(201);
    const saved = await fixture.database.client.player.findUniqueOrThrow({
      where: { id: boundaryValid.body.data.id },
    });
    expect(saved.code).toBe('007_VN_TODAY');
    expect(saved.fullName).toBe('Nguyễn Quang Hải');

    // Duplicate code (case-insensitive after normalization) rejected with 409
    await fixture
      .apiRequest(granteeLate, 'post', '/players', {
        ...samplePlayer,
        code: '007_VN_TODAY',
        fullName: 'Cầu thủ khác',
      })
      .expect(409);

    // Code cannot be altered on PATCH
    await fixture
      .apiRequest(granteeLate, 'patch', `/players/${boundaryValid.body.data.id}`, {
        expectedRevision: '1',
        code: 'NEW_CODE',
        fullName: 'Đổi mã',
      })
      .expect(400);
  });

  it('requires exact D058 suspected-duplicate review on normalized name + birthDate + nationality and serializes races', async () => {
    const grantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);

    const first = await fixture.apiRequest(grantee, 'post', '/players', samplePlayer).expect(201);
    const firstId = first.body.data.id as string;

    // Different birthDate or nationality does NOT trigger suspected-duplicate warning
    await fixture
      .apiRequest(grantee, 'post', '/players', {
        ...samplePlayer,
        code: 'PL_DIFF_DOB',
        birthDate: '1997-04-13',
      })
      .expect(201);
    await fixture
      .apiRequest(grantee, 'post', '/players', {
        ...samplePlayer,
        code: 'PL_DIFF_NAT',
        nationalityCode: 'ENG',
      })
      .expect(201);

    // Exact normalized match (case/whitespace normalized, same dob & nationality) triggers 409 BASIS_CHANGED with candidates
    const duplicateInput = {
      ...samplePlayer,
      code: 'PL_SAME_PERSON_CHECK',
      fullName: 'nguyễn   quang hải',
    };
    const warning = await fixture
      .apiRequest(grantee, 'post', '/players', duplicateInput)
      .expect(409);
    expect(warning.body.error).toMatchObject({
      code: 'BASIS_CHANGED',
      candidates: [{ id: firstId, code: '007_PL', name: 'Nguyễn Quang Hải' }],
    });

    // Separate person allowed only with exact candidateIds acknowledgement + reason
    const reviewReason = 'Hai cầu thủ khác nhau trùng họ tên, ngày sinh và quốc tịch.';
    const distinct = await fixture
      .apiRequest(grantee, 'post', '/players', {
        ...duplicateInput,
        duplicateReview: {
          acknowledged: true,
          candidateIds: [firstId],
          reason: reviewReason,
        },
      })
      .expect(201);
    expect(distinct.body.data.id).not.toBe(firstId);

    const audit = await fixture.database.client.auditRecord.findFirst({
      where: { actionCode: 'PLAYER_CREATED', objectId: distinct.body.data.id },
      select: { reason: true },
    });
    expect(audit).toEqual({ reason: reviewReason });

    // Competing concurrent creates with same normalized tuple serialize cleanly [201, 409]
    const raceBase = {
      fullName: 'Trần Văn Đua',
      birthDate: '2001-09-01',
      nationalityCode: 'VN',
      positionCode: 'ST',
    };
    const results = await Promise.all([
      fixture.apiRequest(grantee, 'post', '/players', { ...raceBase, code: 'RACE_A' }),
      fixture.apiRequest(grantee, 'post', '/players', {
        ...raceBase,
        code: 'RACE_B',
        fullName: 'TRẦN VĂN ĐUA',
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('audits D036 corrections with before/after, preserves approved snapshots, reports scoped impact, and works while season is Closed (D074)', async () => {
    const seasonA = fixture.seasons[0].id;
    const seasonB = fixture.seasons[1].id;
    await fixture.seedEffectiveRegulation(seasonA, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-20T00:00:00.000Z' },
    });
    const { club, stadium } = await fixture.seedClubAndStadium('COR');

    const grantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    const created = await fixture.apiRequest(grantee, 'post', '/players', samplePlayer).expect(201);
    const playerId = created.body.data.id as string;

    // Approve a BM1 application referencing this player so an official snapshot exists
    const appDraft = await fixture
      .apiRequest(grantee, 'post', `/seasons/${seasonA}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Snapshot',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện Snapshot',
        representativePhone: '0901234567',
        contactAddress: '10 Snapshot Rd',
        proposedPlayers: [{ playerId, shirtNumber: 19 }],
      })
      .expect(201);
    const caseId = appDraft.body.data.caseId as string;
    const versionId = appDraft.body.data.versionId as string;
    const rec = await fixture
      .apiRequest(grantee, 'post', `/club-applications/${caseId}/receive`, {
        versionId,
        expectedRevision: '1',
      })
      .expect(200);
    const sub = await fixture
      .apiRequest(grantee, 'post', `/club-applications/${caseId}/submit`, {
        versionId,
        expectedRevision: rec.body.data.revision,
      })
      .expect(200);
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${caseId}/approve`,
        { versionId, expectedRevision: sub.body.data.revision, reason: 'Phê duyệt BM1.' },
        randomUUID(),
      )
      .expect(200);

    // Close ALL seasons to verify D074: shared Player master edits remain available while seasons are Closed!
    await fixture.database.client.season.updateMany({ data: { state: 'CLOSED' } });

    // D036 correction with reason + basis while seasons are CLOSED
    const correction = await fixture
      .apiRequest(grantee, 'patch', `/players/${playerId}`, {
        expectedRevision: '1',
        fullName: 'Nguyễn Quang Hải (Đã hiệu chỉnh)',
        positionCode: 'RW',
        correctionReason: 'Hiệu chỉnh họ tên và vị trí theo hồ sơ gốc.',
        correctionBasis: 'Công văn đính chính số 02/2026.',
      })
      .expect(200);
    expect(correction.body.data.revision).toBe('2');

    // Stale revision rejected
    await fixture
      .apiRequest(grantee, 'patch', `/players/${playerId}`, {
        expectedRevision: '1',
        fullName: 'Ghi đè cũ',
      })
      .expect(409);

    // History contains PLAYER_CORRECTED with before/after and basis
    const history = await fixture
      .apiRequest(grantee, 'get', `/players/${playerId}/history?actionCode=PLAYER_CORRECTED`)
      .expect(200);
    expect(history.body.meta.total).toBe(1);
    expect(history.body.data.items[0]).toMatchObject({
      actionCode: 'PLAYER_CORRECTED',
      reason: 'Hiệu chỉnh họ tên và vị trí theo hồ sơ gốc.',
      before: { fullName: 'Nguyễn Quang Hải', positionCode: 'CAM' },
      after: {
        fullName: 'Nguyễn Quang Hải (Đã hiệu chỉnh)',
        positionCode: 'RW',
        correctionBasis: 'Công văn đính chính số 02/2026.',
      },
    });

    // Existing approved BM1 official snapshot was NOT silently rewritten!
    const appDetail = await fixture
      .apiRequest(manager, 'get', `/club-applications/${caseId}`)
      .expect(200);
    const approvedVer = appDetail.body.data.versions.find(
      (v: { id: string }) => v.id === versionId,
    );
    expect(approvedVer.officialSnapshot.proposedPlayers[0]).toMatchObject({
      playerId,
      fullName: 'Nguyễn Quang Hải',
      positionCode: 'CAM',
    });

    // Scoped correction-impact reports affected BM1 reference in Season A, hides unrelated Season B
    const impactA = await fixture
      .apiRequest(grantee, 'get', `/players/${playerId}/correction-impact?seasonId=${seasonA}`)
      .expect(200);
    expect(impactA.body.data.status).toBe('KNOWN');
    expect(impactA.body.data.affected).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'CLUB_APPLICATION', id: caseId })]),
    );
    await fixture
      .apiRequest(grantee, 'get', `/players/${playerId}/correction-impact?seasonId=${seasonB}`)
      .expect(404);

    // Also verify creating a NEW player while all seasons are CLOSED works under D074
    await fixture
      .apiRequest(grantee, 'post', '/players', {
        code: 'CLOSED_OK',
        fullName: 'Cầu thủ Tạo Khi Mùa Đóng',
        birthDate: '2003-01-01',
        nationalityCode: 'ENG',
        positionCode: 'GK',
      })
      .expect(201);
  });
});
