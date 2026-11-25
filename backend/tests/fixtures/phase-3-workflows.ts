import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import {
  DECLARED_TEST_ONLY_REGULATION,
  createAuthorizedTestImage,
  type Phase3AuthTokens,
  type setupPhase3HttpFixture,
} from '../integration/phase-3-fixtures';

type Fixture = ReturnType<typeof setupPhase3HttpFixture>;
export type VersionReceipt = { caseId: string; versionId: string; revision: string };

/** Test-only workflow driver: every official record is produced through the owning HTTP interface. */
export function phase3Workflows(fixture: Fixture) {
  async function login(accountId: string): Promise<Phase3AuthTokens> {
    const account = await fixture.database.client.account.findUniqueOrThrow({
      where: { id: accountId },
    });
    const http = request(fixture.app.getHttpServer());
    const pre = await http.get('/api/v1/auth/csrf').expect(200);
    const cookies = (res: request.Response) =>
      (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
    const logged = await http
      .post('/api/v1/auth/login')
      .set('Origin', fixture.origin)
      .set('Cookie', cookies(pre))
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .send({ username: account.username, password: 'Synthetic phase3 credential 🦉 only' })
      .expect(200);
    const sessionCookie = cookies(logged);
    const token = sessionCookie
      .split('; ')
      .find((c) => c.startsWith(SESSION_COOKIE + '='))!
      .slice(SESSION_COOKIE.length + 1);
    const csrf = await http.get('/api/v1/auth/csrf').set('Cookie', sessionCookie).expect(200);
    return {
      accountId,
      token,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      csrfToken: csrf.body.data.csrfToken as string,
    };
  }
  async function staff() {
    return {
      officer: await fixture.authenticate(fixture.staff.registrationOfficerA),
      manager: await fixture.authenticate(fixture.staff.seasonManagerA),
      approver: await fixture.authenticate(fixture.staff.seasonManagerB),
      playerManager: await fixture.authenticate(fixture.staff.playerMasterGrantee),
    };
  }

  async function rule(
    seasonId: string,
    overrides: Record<string, unknown> = {},
    currentVersionId?: string,
  ) {
    const { manager, approver } = await staff();
    const { evidenceKind: _kind, testOnly: _testOnly, ...values } = DECLARED_TEST_ONLY_REGULATION;
    void _kind;
    void _testOnly;
    const created = await fixture
      .apiRequest(manager, 'post', `/seasons/${seasonId}/regulation-versions`, {
        ...values,
        effectiveMode: 'IMMEDIATE',
        registrationWindows: ['CLUB_APPLICATION', 'PLAYER_CHANGE'].map((intakeKind) => ({
          intakeKind,
          opensAt: '2026-08-01T00:00:00.000Z',
          closesAt: '2026-12-01T00:00:00.000Z',
        })),
        rankingPriority: [
          { position: 1, criterionCode: 'POINTS' },
          { position: 2, criterionCode: 'GOAL_DIFFERENCE' },
          { position: 3, criterionCode: 'GOALS_FOR' },
        ],
        goalTypes: [
          { code: 'NORMAL', name: 'Bàn thắng', isOwnGoal: false, enabled: true },
          { code: 'OWN', name: 'Phản lưới', isOwnGoal: true, enabled: true },
        ],
        cardTypes: [
          { code: 'Y', name: 'Thẻ vàng', meaning: 'YELLOW', enabled: true },
          { code: 'R', name: 'Thẻ đỏ', meaning: 'RED', enabled: true },
        ],
        ...overrides,
      })
      .expect(201);
    const versionId = created.body.data.id as string;
    const submitted = await fixture
      .apiRequest(manager, 'post', `/regulation-versions/${versionId}/submit`, {
        expectedRevision: created.body.data.revision,
        reason: 'Bộ quy định kiểm thử tích hợp cô lập.',
      })
      .expect(200);
    const approved = await fixture.apiRequest(
      approver,
      'post',
      `/regulation-versions/${versionId}/approve`,
      {
        expectedRevision: submitted.body.data.revision,
        submittedVersionId: versionId,
        expectedCurrentVersionId: currentVersionId ?? null,
        reason: 'Phê duyệt độc lập quy định kiểm thử.',
      },
      randomUUID(),
    );
    return { versionId, approved };
  }

  async function player(suffix: string, birthDate = '2000-01-01') {
    const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const response = await fixture
      .apiRequest(auth, 'post', '/players', {
        code: `P_${suffix}`,
        fullName: `Cầu thủ ${suffix}`,
        birthDate,
        nationalityCode: 'ENG',
        positionCode: 'CM',
      })
      .expect(201);
    return response.body.data as { id: string; revision: string };
  }

  async function participation(seasonId: string, playerId: string, suffix: string) {
    const { officer, manager } = await staff();
    const stadiumManager = await fixture.authenticate(fixture.staff.stadiumMasterGrantee);
    const club = await fixture
      .apiRequest(manager, 'post', '/clubs', {
        code: `C_${suffix}`,
        name: `Câu lạc bộ ${suffix}`,
        abbreviation: suffix,
      })
      .expect(201);
    const stadium = await fixture
      .apiRequest(stadiumManager, 'post', '/stadiums', {
        code: `S_${suffix}`,
        name: `Sân vận động ${suffix}`,
        location: 'London',
      })
      .expect(201);
    const clubId = club.body.data.id as string;
    const stadiumId = stadium.body.data.id as string;
    const draft = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId,
        homeStadiumId: stadiumId,
        coachName: 'Huấn luyện viên',
        representativeName: 'Đại diện',
        representativePhone: '0901234567',
        contactAddress: '10 London Road',
        proposedPlayers: [{ playerId, shirtNumber: 9 }],
      })
      .expect(201);
    const receipt = draft.body.data as VersionReceipt;
    let revision = receipt.revision;
    for (const action of ['receive', 'submit', 'approve']) {
      const response = await fixture
        .apiRequest(
          action === 'approve' ? manager : officer,
          'post',
          `/club-applications/${receipt.caseId}/${action}`,
          {
            versionId: receipt.versionId,
            expectedRevision: revision,
            reason: 'Hồ sơ đủ căn cứ kiểm thử.',
          },
          action === 'approve' ? randomUUID() : undefined,
        )
        .expect(200);
      revision = response.body.data.revision as string;
    }
    return { ...receipt, revision, clubId, stadiumId };
  }

  async function registration(
    seasonId: string,
    clubId: string,
    playerId: string,
    options: Record<string, unknown> = {},
    confirm = true,
  ) {
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const draft = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/player-registrations`, {
        clubId,
        playerId,
        shirtNumber: 9,
        playingStart: '2026-08-10T10:00:00.000Z',
        nonHomegrownOptIn: true,
        ...options,
      })
      .expect(201);
    const receipt = draft.body.data as VersionReceipt;
    const received = await fixture
      .apiRequest(officer, 'post', `/player-registrations/${receipt.caseId}/receive`, {
        versionId: receipt.versionId,
        expectedRevision: receipt.revision,
      })
      .expect(200);
    if (!confirm) return { ...receipt, revision: received.body.data.revision as string };
    const confirmed = await fixture
      .apiRequest(
        officer,
        'post',
        `/player-registrations/${receipt.caseId}/confirm-valid`,
        {
          versionId: receipt.versionId,
          expectedRevision: received.body.data.revision,
          reason: 'Xác nhận đăng ký đủ điều kiện.',
        },
        randomUUID(),
      )
      .expect(200);
    return { ...receipt, revision: confirmed.body.data.revision as string };
  }

  async function portrait(auth: Phase3AuthTokens, playerId: string, revision: string) {
    return request(fixture.app.getHttpServer())
      .post(`/api/v1/players/${playerId}/portrait`)
      .set('Cookie', `${SESSION_COOKIE}=${auth.token}`)
      .set('Origin', fixture.origin)
      .set('X-CSRF-Token', auth.csrfToken)
      .field('expectedRevision', revision)
      .attach('file', await createAuthorizedTestImage(), {
        filename: 'portrait.png',
        contentType: 'image/png',
      });
  }
  return { staff, rule, player, participation, registration, portrait, login };
}
