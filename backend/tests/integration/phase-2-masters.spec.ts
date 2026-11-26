import request from 'supertest';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { setupMasterHttpFixture } from '../fixtures/phase-2-master-http';

describe('PHASE 2 Club and Stadium master HTTP contracts', () => {
  const http = setupMasterHttpFixture();
  const {
    database,
    authenticate,
    createClub,
    readClub,
    updateClub,
    clubManager,
    stadiumManager,
    writeMaster,
    club,
  } = http;

  it('rejects writes by a season manager without a live Club master grant', async () => {
    const tokens = await authenticate(http.fixtures.accounts[2].id);
    await createClub(tokens, club).expect(403);
    expect(await database.client.club.count()).toBe(0);
  });

  it('creates a normalized Club for a live Club grantee and rejects reuse of its code', async () => {
    const tokens = await clubManager();
    const response = await createClub(tokens, club).expect(201);
    const persisted = await database.client.club.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(persisted).toMatchObject({
      code: 'RIVER_FC',
      name: 'Câu lạc bộ River',
      abbreviation: 'RFC',
    });
    await createClub(tokens, { ...club, code: 'RIVER_FC', name: 'Another Club' }).expect(409);
    expect(await database.client.club.count()).toBe(1);
  });

  it('requires an exact current same-name review and records the acknowledgement reason', async () => {
    const tokens = await clubManager();
    const original = await createClub(tokens, club).expect(201);
    const sameName = { ...club, code: 'RIVER_02', name: 'câu lạc bộ river' };
    const warning = await createClub(tokens, sameName).expect(409);
    expect(warning.body.error).toMatchObject({
      code: 'BASIS_CHANGED',
      candidates: [{ id: original.body.data.id, code: 'RIVER_FC', name: 'Câu lạc bộ River' }],
    });
    const reason = 'Hai câu lạc bộ độc lập có cùng tên.';
    const review = { acknowledged: true, candidateIds: [original.body.data.id], reason };
    const distinct = await createClub(tokens, { ...sameName, duplicateReview: review }).expect(201);
    await createClub(tokens, { ...sameName, code: 'RIVER_03', duplicateReview: review }).expect(
      409,
    );
    expect(await database.client.club.count()).toBe(2);
    await expect(
      database.client.auditRecord.findFirst({
        where: { actionCode: 'CLUB_CREATED', objectId: distinct.body.data.id },
        select: { reason: true },
      }),
    ).resolves.toEqual({ reason });
  });

  it('serializes competing creates even when neither request initially sees a same-name profile', async () => {
    const tokens = await clubManager();
    const results = await Promise.all([
      createClub(tokens, club),
      createClub(tokens, { ...club, code: 'RIVER_RACE', name: club.name.toUpperCase() }),
    ]);
    expect(results.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(await database.client.club.count()).toBe(1);
  });

  it('reads Club details and bounded history and keeps identity intact across a correction', async () => {
    const tokens = await clubManager();
    const created = await createClub(tokens, club).expect(201);
    const id = created.body.data.id as string;
    const correction = {
      expectedRevision: '1',
      name: 'Câu lạc bộ Riverside',
      correctionReason: 'Sửa tên nhập sai.',
      correctionBasis: 'Đối chiếu hồ sơ câu lạc bộ.',
    };
    await updateClub(tokens, id, { ...correction, code: 'NEW_CODE' }).expect(400);
    await updateClub(tokens, id, correction).expect(200);
    await updateClub(tokens, id, { ...correction, name: 'Tên ghi đè' }).expect(409);

    const detail = await readClub(tokens, `/${id}`).expect(200);
    expect(detail.body.data).toMatchObject({
      id,
      code: 'RIVER_FC',
      name: correction.name,
      revision: '2',
    });
    const list = await readClub(tokens, '?search=RFC&pageSize=1').expect(200);
    expect(list.body.meta).toMatchObject({ total: 1, pageSize: 1 });
    expect(list.body.data.items).toMatchObject([{ id }]);
    const history = await readClub(tokens, `/${id}/history?actionCode=CLUB_CORRECTED`).expect(200);
    expect(history.body.meta).toMatchObject({ total: 1 });
    const scopedImpact = await readClub(
      tokens,
      `/${id}/correction-impact?seasonId=${http.fixtures.seasons[0].id}`,
    ).expect(200);
    // PHASE 3 registration tables exist while PHASE 4/5 scheduling/results tables remain absent,
    // so composite masterImpact fails closed as UNAVAILABLE per the accepted PHASE 2 port contract.
    expect(scopedImpact.body.data).toEqual({ status: 'UNAVAILABLE', affected: null });
    await readClub(
      tokens,
      `/${id}/correction-impact?seasonId=${http.fixtures.seasons[1].id}`,
    ).expect(404);
    const unrelated = await authenticate(http.fixtures.accounts[4].id);
    await readClub(unrelated, `/${id}/history`).expect(403);
  });

  it('stores Stadium location as optional, rejects foreign grants and paginates deterministically', async () => {
    const input = { code: ' ground_00 ', name: '  Sân    số 00  ' };
    const manager = await clubManager();
    await writeMaster(manager, 'post', '/stadiums', input).expect(403);
    const tokens = await stadiumManager();
    const first = (await writeMaster(tokens, 'post', '/stadiums', input).expect(201)).body.data;
    await writeMaster(tokens, 'post', '/stadiums', { ...input, code: 'GROUND_00' }).expect(409);
    await writeMaster(tokens, 'patch', `/stadiums/${first.id}`, {
      expectedRevision: '1',
      location: '  Hà   Nội  ',
    }).expect(200);
    await writeMaster(tokens, 'patch', `/stadiums/${first.id}`, {
      expectedRevision: '2',
      location: null,
      correctionReason: 'Sửa địa điểm nhập nhầm.',
      correctionBasis: 'Đối chiếu hồ sơ sân.',
    }).expect(200);
    await database.client.stadium.createMany({
      data: Array.from({ length: 20 }, (_, index) => ({
        id: crypto.randomUUID(),
        code: `GROUND_${index + 11}`,
        name: `Sân số ${index + 11}`,
      })),
    });
    const list = (page: number) =>
      request(http.app.getHttpServer())
        .get(`/api/v1/stadiums?sort=code:asc&page=${page}`)
        .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
        .expect(200);
    const page1 = (await list(1)).body;
    const page2 = (await list(2)).body;
    expect(page1.data.items).toHaveLength(20);
    expect(page2.data.items).toHaveLength(1);
    expect(page1.data.items[0]).toMatchObject({
      code: 'GROUND_00',
      name: 'Sân số 00',
      location: null,
    });
    expect(page1.data.counts).toEqual({ total: 21, active: 21, discontinued: 0 });
    expect(page2.meta).toMatchObject({ page: 2, total: 21 });
  });
});
