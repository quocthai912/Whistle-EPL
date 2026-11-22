import {
  assessRegistrationEligibility,
  evaluateHomegrownVerification,
  evaluateU21Classification,
  SOURCE_DEFAULT_HOMEGROWN_MONTHS,
  SOURCE_DEFAULT_HOMEGROWN_SEASONS,
  SOURCE_DEFAULT_NON_HOMEGROWN_LIMIT,
  SOURCE_DEFAULT_SQUAD_LIMIT,
  type EligibilityAssessmentInput,
  type EligibilityRegulationBasis,
} from '../../src/registry-registration/registration-eligibility';
import {
  evaluateQuotaAcrossIntervals,
  findPlayerOverlapConflicts,
  findShirtNumberConflicts,
  intervalsOverlap,
  isValidPlayingInterval,
  isValidShirtNumber,
  type ExistingRegistrationInterval,
} from '../../src/registry-registration/registration-intervals';

describe('PHASE 3 US3 — Eligibility, quota and interval boundaries (T012/T013 unit)', () => {
  const SEASON_1 = '11111111-1111-4111-8111-111111111111';
  const SEASON_2 = '22222222-2222-4222-8222-222222222222';
  const CLUB_A = '33333333-3333-4333-8333-333333333333';
  const PLAYER_1 = '55555555-5555-4555-8555-555555555555';
  const REG_V1 = '66666666-6666-4666-8666-666666666666';
  const REG_V2 = '77777777-7777-4777-8777-777777777777';
  const VERIFIER_1 = '88888888-8888-4888-8888-888888888888';
  const APP_V1 = '99999999-9999-4999-8999-999999999999';

  const baseRegulation: EligibilityRegulationBasis = {
    id: REG_V1,
    seasonId: SEASON_1,
    squadLimit: SOURCE_DEFAULT_SQUAD_LIMIT,
    nonHomegrownLimit: SOURCE_DEFAULT_NON_HOMEGROWN_LIMIT,
    homegrownSeasons: SOURCE_DEFAULT_HOMEGROWN_SEASONS,
    homegrownMonths: SOURCE_DEFAULT_HOMEGROWN_MONTHS,
    homegrownAgeStart: 15,
    homegrownAgeEnd: 21,
    u21CutoffIso: '2005-01-01',
  };

  function buildBaseInput(
    overrides: Partial<EligibilityAssessmentInput> = {},
  ): EligibilityAssessmentInput {
    return {
      mode: 'CONFIRMATION',
      seasonId: SEASON_1,
      clubId: CLUB_A,
      playerId: PLAYER_1,
      regulation: baseRegulation,
      clubParticipation: {
        clubExists: true,
        hasApprovedApplication: true,
        acceptedApplicationVersionId: APP_V1,
        clubDiscontinued: false,
      },
      receipt: {
        receivedAt: new Date('2026-08-05T10:00:00.000Z'),
        receiptTimingStatus: 'ON_TIME',
        receiptRegulationVersionId: REG_V1,
        receiptWindowId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        approvedExceptionVersionId: null,
      },
      player: {
        id: PLAYER_1,
        birthDateIso: '2001-06-15',
      },
      candidate: {
        shirtNumber: 10,
        playingStart: new Date('2026-08-15T00:00:00.000Z'),
        playingEnd: null,
        nonHomegrownOptIn: false,
        homegrownEvidence: {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: '3 mùa giải đào tạo tại học viện liên kết FA Anh (16–19 tuổi).',
          evidenceReference: 'FA-HG-2026-001',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
      },
      existingPlayerIntervals: [],
      existingClubSeasonIntervals: [],
      ...overrides,
    };
  }

  function makeExistingSquad(
    countedNonHomegrown: number,
    countedHomegrown: number,
    u21Count = 0,
    startIso = '2026-08-01T00:00:00.000Z',
    endIso: string | null = null,
  ): ExistingRegistrationInterval[] {
    const rows: ExistingRegistrationInterval[] = [];
    let idx = 1;
    const push = (u21: boolean, homegrown: boolean | null) => {
      const n = idx++;
      rows.push({
        registrationId: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
        versionId: `00000000-0000-4000-9000-${String(n).padStart(12, '0')}`,
        seasonId: SEASON_1,
        clubId: CLUB_A,
        playerId: `00000000-0000-4000-a000-${String(n).padStart(12, '0')}`,
        shirtNumber: n <= 99 ? n : null,
        playingStart: new Date(startIso),
        playingEnd: endIso ? new Date(endIso) : null,
        u21Finding: u21,
        homegrownFinding: homegrown,
        playingDisposition: null,
      });
    };
    for (let i = 0; i < countedNonHomegrown; i++) push(false, false);
    for (let i = 0; i < countedHomegrown; i++) push(false, true);
    for (let i = 0; i < u21Count; i++) push(true, null);
    return rows;
  }

  describe('U21 calendar cutoff equality and independence from nationality (FR-014, D054)', () => {
    it('qualifies U21 when birthDate equals u21Cutoff or is later, and does not qualify one day earlier', () => {
      const exactCutoff = evaluateU21Classification('2005-01-01', baseRegulation);
      expect(exactCutoff.u21Finding).toBe(true);
      expect(exactCutoff.finding.status).toBe('MET');
      expect(exactCutoff.finding.regulationVersionId).toBe(REG_V1);

      const afterCutoff = evaluateU21Classification('2006-07-20', baseRegulation);
      expect(afterCutoff.u21Finding).toBe(true);
      expect(afterCutoff.finding.status).toBe('MET');

      const dayBeforeCutoff = evaluateU21Classification('2004-12-31', baseRegulation);
      expect(dayBeforeCutoff.u21Finding).toBe(false);
      expect(dayBeforeCutoff.finding.status).toBe('NOT_APPLICABLE');
    });

    it('returns INSUFFICIENT_BASIS when birthDate or u21Cutoff is missing and never infers U21 or homegrown without basis', () => {
      const missingBirth = evaluateU21Classification(null, baseRegulation);
      expect(missingBirth.u21Finding).toBeNull();
      expect(missingBirth.finding.status).toBe('INSUFFICIENT_BASIS');

      const missingCutoff = evaluateU21Classification('2006-01-01', {
        ...baseRegulation,
        u21CutoffIso: null,
      });
      expect(missingCutoff.u21Finding).toBeNull();
      expect(missingCutoff.finding.status).toBe('INSUFFICIENT_BASIS');

      const seniorWithoutEvidence = assessRegistrationEligibility(
        buildBaseInput({
          player: { id: PLAYER_1, birthDateIso: '1999-03-10' },
          candidate: {
            shirtNumber: 11,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          },
        }),
      );
      expect(seniorWithoutEvidence.u21Finding).toBe(false);
      expect(seniorWithoutEvidence.homegrownFinding).toBeNull();
      expect(seniorWithoutEvidence.eligibleForConfirmation).toBe(false);
      expect(
        seniorWithoutEvidence.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')
          ?.status,
      ).toBe('INSUFFICIENT_BASIS');
    });
  });

  describe('Homegrown verification branches, insufficient basis and opt-in non-homegrown (FR-014, D054)', () => {
    it('accepts both SEASONS (>= 3) and MONTHS (>= 36) branches with complete D054 evidence', () => {
      const seasonsRes = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: '3 mùa liên kết FA Anh',
          evidenceReference: 'REF-S-01',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(seasonsRes.homegrownFinding).toBe(true);
      expect(seasonsRes.finding.status).toBe('MET');

      const monthsRes = evaluateHomegrownVerification(
        {
          evidenceBranch: 'MONTHS',
          qualifyingValue: 36,
          evidenceSummary: '36 tháng liên kết FAW Xứ Wales',
          evidenceReference: 'REF-M-01',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(monthsRes.homegrownFinding).toBe(true);
      expect(monthsRes.finding.status).toBe('MET');
    });

    it('rejects below-threshold values, non-affiliated training, null affiliation, incomplete evidence, null thresholds and mismatched rule versions', () => {
      const shortSeasons = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 2,
          evidenceSummary: 'Chỉ 2 mùa giải',
          evidenceReference: 'REF-S-02',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(shortSeasons.homegrownFinding).toBe(false);
      expect(shortSeasons.finding.status).toBe('UNMET');

      const shortMonths = evaluateHomegrownVerification(
        {
          evidenceBranch: 'MONTHS',
          qualifyingValue: 35,
          evidenceSummary: 'Chỉ 35 tháng',
          evidenceReference: 'REF-M-02',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(shortMonths.homegrownFinding).toBe(false);
      expect(shortMonths.finding.status).toBe('UNMET');

      const nonAffiliated = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 5,
          evidenceSummary: 'Đào tạo ngoài liên đoàn Anh/Xứ Wales',
          evidenceReference: 'REF-NA-01',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: false,
        },
        false,
        baseRegulation,
      );
      expect(nonAffiliated.homegrownFinding).toBe(false);
      expect(nonAffiliated.finding.status).toBe('UNMET');

      // Missing affiliatedAssociationBasis -> INSUFFICIENT_BASIS (never assumed true)
      const nullAffiliated = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: 'Chưa xác nhận liên đoàn',
          evidenceReference: 'REF-NA-02',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: null,
        },
        false,
        baseRegulation,
      );
      expect(nullAffiliated.homegrownFinding).toBeNull();
      expect(nullAffiliated.finding.status).toBe('INSUFFICIENT_BASIS');

      // Null homegrownSeasons in regulation -> INSUFFICIENT_BASIS (no synthesized fallback)
      const nullThreshold = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: '3 mùa',
          evidenceReference: 'REF-NT-01',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        { ...baseRegulation, homegrownSeasons: null },
      );
      expect(nullThreshold.homegrownFinding).toBeNull();
      expect(nullThreshold.finding.status).toBe('INSUFFICIENT_BASIS');

      const missingVerifier = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: 'Thiếu người xác minh',
          evidenceReference: 'REF-MV-01',
          verifiedBy: null,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V1,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(missingVerifier.homegrownFinding).toBeNull();
      expect(missingVerifier.finding.status).toBe('INSUFFICIENT_BASIS');

      const staleRuleBasis = evaluateHomegrownVerification(
        {
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: 'Xác minh theo quy định cũ',
          evidenceReference: 'REF-OLD-01',
          verifiedBy: VERIFIER_1,
          verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
          verifiedRegulationVersionId: REG_V2,
          affiliatedAssociationBasis: true,
        },
        false,
        baseRegulation,
      );
      expect(staleRuleBasis.homegrownFinding).toBeNull();
      expect(staleRuleBasis.finding.status).toBe('INSUFFICIENT_BASIS');
    });

    it('allows explicit nonHomegrownOptIn when evidence is missing and does not block U21 candidates on optional homegrown evidence', () => {
      const optInResult = assessRegistrationEligibility(
        buildBaseInput({
          candidate: {
            shirtNumber: 14,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
        }),
      );
      expect(optInResult.homegrownFinding).toBe(false);
      expect(
        optInResult.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')?.status,
      ).toBe('NOT_APPLICABLE');
      expect(optInResult.eligibleForConfirmation).toBe(true);

      const u21WithoutHomegrown = assessRegistrationEligibility(
        buildBaseInput({
          player: { id: PLAYER_1, birthDateIso: '2005-01-01' },
          candidate: {
            shirtNumber: 45,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          },
        }),
      );
      expect(u21WithoutHomegrown.u21Finding).toBe(true);
      expect(u21WithoutHomegrown.homegrownFinding).toBeNull();
      expect(
        u21WithoutHomegrown.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')?.status,
      ).toBe('NOT_APPLICABLE');
      expect(u21WithoutHomegrown.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
        'NOT_APPLICABLE',
      );
      expect(
        u21WithoutHomegrown.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status,
      ).toBe('NOT_APPLICABLE');
      expect(u21WithoutHomegrown.eligibleForConfirmation).toBe(true);

      // U21 candidate with failing optional homegrown evidence still qualifies as U21
      const u21WithShortHomegrown = assessRegistrationEligibility(
        buildBaseInput({
          player: { id: PLAYER_1, birthDateIso: '2005-06-01' },
          candidate: {
            shirtNumber: 46,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: {
              evidenceBranch: 'SEASONS',
              qualifyingValue: 1,
              evidenceSummary: '1 mùa tại học viện',
              evidenceReference: 'REF-U21-1',
              verifiedBy: VERIFIER_1,
              verifiedAt: new Date('2026-08-05T09:00:00.000Z'),
              verifiedRegulationVersionId: REG_V1,
              affiliatedAssociationBasis: true,
            },
          },
        }),
      );
      expect(u21WithShortHomegrown.u21Finding).toBe(true);
      expect(u21WithShortHomegrown.homegrownFinding).toBe(false);
      expect(u21WithShortHomegrown.eligibleForConfirmation).toBe(true);
    });
  });

  describe('Configured and default 25/17 limits and future composition boundaries (FR-015, D075)', () => {
    it('enforces default 25/17 limits while excluding qualifying U21 from both counts', () => {
      const full25With17NonHg = makeExistingSquad(17, 8, 2);

      const u21Candidate = assessRegistrationEligibility(
        buildBaseInput({
          player: { id: PLAYER_1, birthDateIso: '2005-01-01' },
          candidate: {
            shirtNumber: 50,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          },
          existingClubSeasonIntervals: full25With17NonHg,
        }),
      );
      expect(u21Candidate.eligibleForConfirmation).toBe(true);

      const hgOver25 = assessRegistrationEligibility(
        buildBaseInput({
          candidate: {
            shirtNumber: 51,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: buildBaseInput().candidate.homegrownEvidence,
          },
          existingClubSeasonIntervals: full25With17NonHg,
        }),
      );
      expect(hgOver25.eligibleForConfirmation).toBe(false);
      expect(hgOver25.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe('UNMET');
      expect(hgOver25.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status).toBe(
        'NOT_APPLICABLE',
      );

      const at17NonHgOf24 = makeExistingSquad(17, 7);
      const nonHg18 = assessRegistrationEligibility(
        buildBaseInput({
          candidate: {
            shirtNumber: 52,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
          existingClubSeasonIntervals: at17NonHgOf24,
        }),
      );
      expect(nonHg18.eligibleForConfirmation).toBe(false);
      expect(nonHg18.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe('MET');
      expect(nonHg18.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status).toBe(
        'UNMET',
      );
    });

    it('enforces custom configured limits and refuses null limits without synthesizing defaults', () => {
      const customReg: EligibilityRegulationBasis = {
        ...baseRegulation,
        id: REG_V2,
        squadLimit: 22,
        nonHomegrownLimit: 15,
        homegrownSeasons: 4,
        homegrownMonths: 48,
      };
      const existing22 = makeExistingSquad(15, 7);

      const overCustom = assessRegistrationEligibility(
        buildBaseInput({
          regulation: customReg,
          candidate: {
            shirtNumber: 60,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
          existingClubSeasonIntervals: existing22,
        }),
      );
      expect(overCustom.eligibleForConfirmation).toBe(false);
      expect(overCustom.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe('UNMET');
      expect(overCustom.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status).toBe(
        'UNMET',
      );

      // Null squadLimit/nonHomegrownLimit -> INSUFFICIENT_BASIS for a non-homegrown senior (no synthesized 25/17)
      const nullLimits = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, squadLimit: null, nonHomegrownLimit: null },
          candidate: {
            shirtNumber: 61,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
        }),
      );
      expect(nullLimits.eligibleForConfirmation).toBe(false);
      expect(nullLimits.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
        'INSUFFICIENT_BASIS',
      );
      expect(nullLimits.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status).toBe(
        'INSUFFICIENT_BASIS',
      );
    });

    it('detects future composition boundary quota breach and counts non-U21 rows even with null homegrownFinding', () => {
      const activeToday = makeExistingSquad(10, 10, 0, '2026-08-01T00:00:00.000Z', null);
      const futurePlan: ExistingRegistrationInterval[] = makeExistingSquad(
        5,
        0,
        0,
        '2026-10-01T00:00:00.000Z',
        null,
      ).map((row, idx) => ({
        ...row,
        registrationId: `10000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
        versionId: `10000000-0000-4000-9000-${String(idx + 1).padStart(12, '0')}`,
        playerId: `10000000-0000-4000-a000-${String(idx + 1).padStart(12, '0')}`,
        shirtNumber: 40 + idx,
        homegrownFinding: idx === 0 ? null : false,
      }));

      const sweep = evaluateQuotaAcrossIntervals(
        {
          playingStart: new Date('2026-08-15T00:00:00.000Z'),
          playingEnd: null,
          u21: false,
          homegrown: true,
        },
        [...activeToday, ...futurePlan],
        { squadLimit: 25, nonHomegrownLimit: 17 },
      );

      expect(sweep.boundaries.length).toBe(2);
      expect(sweep.boundaries[0].countedSquadSize).toBe(21);
      expect(sweep.boundaries[1].startsAt).toBe('2026-10-01T00:00:00.000Z');
      expect(sweep.boundaries[1].countedSquadSize).toBe(26);
      expect(sweep.squadBreaches).toHaveLength(1);
      expect(sweep.unresolvedHomegrownIds).toHaveLength(1);
    });
  });

  describe('Shirt number bounds, future shirt conflicts and competition-wide overlap (FR-016, D056)', () => {
    it('enforces shirt numbers 1-99 and rejects overlapping future or U21 shirt allocations', () => {
      expect(isValidShirtNumber(1)).toBe(true);
      expect(isValidShirtNumber(99)).toBe(true);
      expect(isValidShirtNumber(0)).toBe(false);
      expect(isValidShirtNumber(100)).toBe(false);
      expect(isValidShirtNumber(10.5)).toBe(false);

      const futureU21WithShirt7: ExistingRegistrationInterval = {
        registrationId: '20000000-0000-4000-8000-000000000001',
        versionId: '20000000-0000-4000-9000-000000000001',
        seasonId: SEASON_1,
        clubId: CLUB_A,
        playerId: '20000000-0000-4000-a000-000000000001',
        shirtNumber: 7,
        playingStart: new Date('2026-11-01T00:00:00.000Z'),
        playingEnd: null,
        u21Finding: true,
        homegrownFinding: null,
        playingDisposition: null,
      };
      const cancelledShirt7: ExistingRegistrationInterval = {
        ...futureU21WithShirt7,
        registrationId: '20000000-0000-4000-8000-000000000002',
        playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
      };

      const conflicts = findShirtNumberConflicts(
        {
          seasonId: SEASON_1,
          clubId: CLUB_A,
          shirtNumber: 7,
          playingStart: new Date('2026-08-15T00:00:00.000Z'),
          playingEnd: null,
        },
        [futureU21WithShirt7, cancelledShirt7],
      );
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].registrationId).toBe(futureU21WithShirt7.registrationId);
      expect(conflicts[0].overlapStart).toBe('2026-11-01T00:00:00.000Z');
    });

    it('permits adjacent half-open intervals and rejects zero-length, reversed and cross-season overlaps', () => {
      const t1 = new Date('2026-08-01T00:00:00.000Z');
      const t2 = new Date('2026-10-01T00:00:00.000Z');
      const t3 = new Date('2026-12-01T00:00:00.000Z');

      expect(isValidPlayingInterval({ start: t1, end: t1 })).toBe(false);
      expect(isValidPlayingInterval({ start: t2, end: t1 })).toBe(false);
      expect(isValidPlayingInterval({ start: t1, end: t2 })).toBe(true);
      expect(isValidPlayingInterval({ start: t1, end: null })).toBe(true);

      expect(intervalsOverlap({ start: t1, end: t2 }, { start: t2, end: t3 })).toBe(false);

      const season1Existing: ExistingRegistrationInterval = {
        registrationId: '30000000-0000-4000-8000-000000000001',
        versionId: '30000000-0000-4000-9000-000000000001',
        seasonId: SEASON_1,
        clubId: CLUB_A,
        playerId: PLAYER_1,
        shirtNumber: 9,
        playingStart: t1,
        playingEnd: t2,
        u21Finding: false,
        homegrownFinding: true,
        playingDisposition: null,
      };

      expect(
        findPlayerOverlapConflicts(
          { playerId: PLAYER_1, seasonId: SEASON_2, playingStart: t2, playingEnd: t3 },
          [season1Existing],
        ),
      ).toHaveLength(0);

      const crossSeasonConflicts = findPlayerOverlapConflicts(
        {
          playerId: PLAYER_1,
          seasonId: SEASON_2,
          playingStart: new Date('2026-09-15T00:00:00.000Z'),
          playingEnd: t3,
        },
        [season1Existing],
      );
      expect(crossSeasonConflicts).toHaveLength(1);
      expect(crossSeasonConflicts[0].crossSeason).toBe(true);
      expect(crossSeasonConflicts[0].seasonId).toBe(SEASON_1);
      expect(crossSeasonConflicts[0].clubId).toBe(CLUB_A);
    });
  });

  describe('Pending participation, missing club/regulation and receipt vs decision rules (FR-010–013, FR-025)', () => {
    it('distinguishes missing club, pending participation and D099 discontinued club', () => {
      const missingClub = assessRegistrationEligibility(
        buildBaseInput({
          clubParticipation: {
            clubExists: false,
            hasApprovedApplication: false,
            acceptedApplicationVersionId: null,
            clubDiscontinued: false,
          },
        }),
      );
      expect(missingClub.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status).toBe(
        'INSUFFICIENT_BASIS',
      );

      const pendingPrecheck = assessRegistrationEligibility(
        buildBaseInput({
          mode: 'PRECHECK',
          clubParticipation: {
            clubExists: true,
            hasApprovedApplication: false,
            acceptedApplicationVersionId: null,
            clubDiscontinued: false,
          },
          receipt: {
            receivedAt: null,
            receiptTimingStatus: null,
            receiptRegulationVersionId: null,
            receiptWindowId: null,
            approvedExceptionVersionId: null,
          },
        }),
      );
      expect(pendingPrecheck.eligibleForConfirmation).toBe(false);
      expect(
        pendingPrecheck.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status,
      ).toBe('UNMET');
      expect(pendingPrecheck.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
        'NOT_APPLICABLE',
      );
      expect(pendingPrecheck.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
        'MET',
      );

      const discontinuedClub = assessRegistrationEligibility(
        buildBaseInput({
          clubParticipation: {
            clubExists: true,
            hasApprovedApplication: true,
            acceptedApplicationVersionId: APP_V1,
            clubDiscontinued: true,
          },
        }),
      );
      expect(discontinuedClub.eligibleForConfirmation).toBe(false);
      expect(
        discontinuedClub.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status,
      ).toBe('UNMET');
    });

    it('preserves receipt basis under R1 while evaluating decision-time eligibility against R2, and enforces D053 exception on LATE receipt', () => {
      const r2StricterCutoff: EligibilityRegulationBasis = {
        ...baseRegulation,
        id: REG_V2,
        u21CutoffIso: '2006-01-01',
      };

      const decisionUnderR2 = assessRegistrationEligibility(
        buildBaseInput({
          regulation: r2StricterCutoff,
          receipt: {
            receivedAt: new Date('2026-08-05T10:00:00.000Z'),
            receiptTimingStatus: 'ON_TIME',
            receiptRegulationVersionId: REG_V1,
            receiptWindowId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            approvedExceptionVersionId: null,
          },
          player: { id: PLAYER_1, birthDateIso: '2005-06-01' },
          candidate: {
            shirtNumber: 20,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          },
        }),
      );
      expect(decisionUnderR2.receiptRegulationVersionId).toBe(REG_V1);
      expect(decisionUnderR2.regulationVersionId).toBe(REG_V2);
      expect(decisionUnderR2.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
        'MET',
      );
      expect(decisionUnderR2.u21Finding).toBe(false);
      expect(decisionUnderR2.eligibleForConfirmation).toBe(false);
      expect(
        decisionUnderR2.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')?.status,
      ).toBe('INSUFFICIENT_BASIS');

      const lateNoException = assessRegistrationEligibility(
        buildBaseInput({
          receipt: {
            receivedAt: new Date('2026-09-05T10:00:00.000Z'),
            receiptTimingStatus: 'LATE',
            receiptRegulationVersionId: REG_V1,
            receiptWindowId: null,
            approvedExceptionVersionId: null,
          },
        }),
      );
      expect(lateNoException.eligibleForConfirmation).toBe(false);
      expect(lateNoException.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
        'UNMET',
      );

      const lateWithException = assessRegistrationEligibility(
        buildBaseInput({
          receipt: {
            receivedAt: new Date('2026-09-05T10:00:00.000Z'),
            receiptTimingStatus: 'LATE',
            receiptRegulationVersionId: REG_V1,
            receiptWindowId: null,
            approvedExceptionVersionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          },
        }),
      );
      expect(lateWithException.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
        'MET',
      );
      expect(lateWithException.eligibleForConfirmation).toBe(true);
    });

    it('blocks confirmation when no effective regulation exists or regulation belongs to another season', () => {
      const noReg = assessRegistrationEligibility(buildBaseInput({ regulation: null }));
      expect(noReg.eligibleForConfirmation).toBe(false);
      expect(noReg.criteria.find((c) => c.criterion === 'EFFECTIVE_REGULATION')?.status).toBe(
        'UNMET',
      );

      // Foreign-season regulation is treated as absent — never substituted for U21, homegrown or quotas
      const foreignSeasonReg = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, seasonId: SEASON_2 },
        }),
      );
      expect(foreignSeasonReg.eligibleForConfirmation).toBe(false);
      expect(foreignSeasonReg.regulationVersionId).toBeNull();
      expect(foreignSeasonReg.u21Finding).toBeNull();
      expect(foreignSeasonReg.homegrownFinding).toBeNull();
      expect(
        foreignSeasonReg.criteria.find((c) => c.criterion === 'EFFECTIVE_REGULATION')?.status,
      ).toBe('UNMET');
      expect(
        foreignSeasonReg.criteria.find((c) => c.criterion === 'U21_CLASSIFICATION')?.status,
      ).toBe('INSUFFICIENT_BASIS');
      expect(
        foreignSeasonReg.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')?.status,
      ).toBe('INSUFFICIENT_BASIS');
      expect(foreignSeasonReg.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
        'INSUFFICIENT_BASIS',
      );
      expect(
        foreignSeasonReg.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status,
      ).toBe('INSUFFICIENT_BASIS');
    });

    it('evaluates nonHomegrownOptIn, U21 exemption and independent quota limits without false missing-basis blocks', () => {
      // Senior candidate with explicit nonHomegrownOptIn is not blocked by null training-age range
      const optInWithNullAgeRange = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, homegrownAgeStart: null, homegrownAgeEnd: null },
          candidate: {
            shirtNumber: 19,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
        }),
      );
      expect(optInWithNullAgeRange.eligibleForConfirmation).toBe(true);
      expect(
        optInWithNullAgeRange.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')
          ?.status,
      ).toBe('NOT_APPLICABLE');
      expect(
        optInWithNullAgeRange.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status,
      ).toBe('MET');
      expect(
        optInWithNullAgeRange.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status,
      ).toBe('MET');

      // Qualifying U21 is exempt from quotas even when quota limits are null
      const u21WithNullQuotas = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, squadLimit: null, nonHomegrownLimit: null },
          player: { id: PLAYER_1, birthDateIso: '2005-01-01' },
          candidate: {
            shirtNumber: 47,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          },
        }),
      );
      expect(u21WithNullQuotas.eligibleForConfirmation).toBe(true);
      expect(u21WithNullQuotas.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
        'NOT_APPLICABLE',
      );
      expect(
        u21WithNullQuotas.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status,
      ).toBe('NOT_APPLICABLE');

      // Independent quota checks: squadLimit set + nonHomegrownLimit null
      const homegrownWithNullNonHgLimit = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, nonHomegrownLimit: null },
        }),
      );
      expect(homegrownWithNullNonHgLimit.eligibleForConfirmation).toBe(true);
      expect(
        homegrownWithNullNonHgLimit.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status,
      ).toBe('MET');
      expect(
        homegrownWithNullNonHgLimit.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')
          ?.status,
      ).toBe('NOT_APPLICABLE');

      const nonHgWithNullNonHgLimit = assessRegistrationEligibility(
        buildBaseInput({
          regulation: { ...baseRegulation, nonHomegrownLimit: null },
          candidate: {
            shirtNumber: 22,
            playingStart: new Date('2026-08-15T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          },
        }),
      );
      expect(nonHgWithNullNonHgLimit.eligibleForConfirmation).toBe(false);
      expect(
        nonHgWithNullNonHgLimit.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status,
      ).toBe('MET');
      expect(
        nonHgWithNullNonHgLimit.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status,
      ).toBe('INSUFFICIENT_BASIS');
    });
  });
});
