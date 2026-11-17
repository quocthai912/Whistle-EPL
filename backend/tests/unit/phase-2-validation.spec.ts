import {
  validateCompleteRegulationContent,
  validateDraftContent,
  type RegulationDraftContent,
} from '../../src/season-regulations/regulation-validation';

const completeContent = (): RegulationDraftContent => ({
  effectiveMode: 'IMMEDIATE',
  proposedEffectiveAt: null,
  squadLimit: 25,
  nonHomegrownLimit: 17,
  homegrownSeasons: 3,
  homegrownMonths: 36,
  homegrownAgeStart: 15,
  homegrownAgeEnd: 21,
  u21Cutoff: '2005-01-01',
  registrationWindows: [
    {
      intakeKind: 'CLUB_APPLICATION',
      opensAt: '2026-05-31T17:00:00Z',
      closesAt: '2026-07-31T17:00:00Z',
    },
    {
      intakeKind: 'PLAYER_CHANGE',
      opensAt: '2026-05-31T17:00:00Z',
      closesAt: '2026-07-31T17:00:00Z',
    },
  ],
  clubCount: 20,
  formatCode: 'DOUBLE_ROUND_ROBIN',
  legs: 2,
  plannedMinutes: 120,
  preparationMinutes: 30,
  releaseMinutes: 30,
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  rankingPriority: [
    { position: 1, criterionCode: 'POINTS' },
    { position: 2, criterionCode: 'GOAL_DIFFERENCE' },
    { position: 3, criterionCode: 'GOALS_FOR' },
  ],
  qualificationCount: 4,
  relegationCount: 3,
  goalTypes: [
    { code: 'A', name: 'Ordinary goal', isOwnGoal: false, enabled: true },
    { code: 'B', name: 'Penalty', isOwnGoal: false, enabled: true },
    { code: 'C', name: 'Own goal', isOwnGoal: true, enabled: true },
    { code: 'D', name: 'Direct free kick', isOwnGoal: false, enabled: true },
  ],
  cardTypes: [
    { code: 'YELLOW', name: 'Yellow card', meaning: 'YELLOW', enabled: true },
    { code: 'RED', name: 'Red card', meaning: 'RED', enabled: true },
  ],
});

describe('PHASE 2 regulation content validation', () => {
  it('allows blank and partial drafts without fabricating missing seasonal values', () => {
    expect(validateDraftContent({})).toEqual({});
    expect(
      validateDraftContent({
        squadLimit: 25,
        nonHomegrownLimit: null,
        homegrownSeasons: 3,
        u21Cutoff: null,
        registrationWindows: [],
      }),
    ).toEqual({
      squadLimit: 25,
      nonHomegrownLimit: null,
      homegrownSeasons: 3,
      u21Cutoff: null,
      registrationWindows: [],
    });
  });

  it('normalizes names and catalog codes using the approved Unicode and code rules', () => {
    const result = validateDraftContent({
      goalTypes: [
        {
          code: '  custom_type  ',
          name: '  Mùa   giải e\u0301  ',
          isOwnGoal: false,
          enabled: true,
        },
      ],
      cardTypes: [{ code: 'yellow-card', name: ' Thẻ   vàng ', meaning: 'YELLOW', enabled: true }],
    });

    expect(result.goalTypes).toEqual([
      { code: 'CUSTOM_TYPE', name: 'Mùa giải é', isOwnGoal: false, enabled: true },
    ]);
    expect(result.cardTypes).toEqual([
      { code: 'YELLOW-CARD', name: 'Thẻ vàng', meaning: 'YELLOW', enabled: true },
    ]);
  });

  it('rejects supplied invalid scalars with actionable field paths', () => {
    expect(() =>
      validateDraftContent({
        squadLimit: -1,
        homegrownAgeStart: 21,
        homegrownAgeEnd: 21,
        u21Cutoff: '2005-02-30',
        clubCount: 21,
        legs: 3,
        plannedMinutes: 0,
        preparationMinutes: -1,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'squadLimit' }),
          expect.objectContaining({ field: 'homegrownAgeEnd' }),
          expect.objectContaining({ field: 'u21Cutoff' }),
          expect.objectContaining({ field: 'clubCount' }),
          expect.objectContaining({ field: 'legs' }),
          expect.objectContaining({ field: 'plannedMinutes' }),
          expect.objectContaining({ field: 'preparationMinutes' }),
        ]),
      }),
    );
  });

  it('enforces date-only and UTC-Z instant formats without accepting local dates or offsets', () => {
    expect(() => validateDraftContent({ u21Cutoff: '2005-1-1' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }),
    );
    expect(() =>
      validateDraftContent({
        registrationWindows: [
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-01T00:00:00+07:00',
            closesAt: '2026-07-01T00:00:00Z',
          },
        ],
      }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
  });

  it('allows adjacent and cross-group windows but rejects same-group half-open overlap', () => {
    expect(() =>
      validateDraftContent({
        registrationWindows: [
          {
            intakeKind: 'CLUB_APPLICATION',
            opensAt: '2026-06-01T00:00:00Z',
            closesAt: '2026-07-01T00:00:00Z',
          },
          {
            intakeKind: 'CLUB_APPLICATION',
            opensAt: '2026-07-01T00:00:00Z',
            closesAt: '2026-08-01T00:00:00Z',
          },
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-15T00:00:00Z',
            closesAt: '2026-07-15T00:00:00Z',
          },
        ],
      }),
    ).not.toThrow();

    expect(() =>
      validateDraftContent({
        registrationWindows: [
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-01T00:00:00Z',
            closesAt: '2026-07-01T00:00:00Z',
          },
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-30T00:00:00Z',
            closesAt: '2026-08-01T00:00:00Z',
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'registrationWindows[1].opensAt' }),
        ]),
      }),
    );
  });

  it('reports duplicate and overlap paths at their original indexes after an invalid row', () => {
    expect(() =>
      validateDraftContent({
        registrationWindows: [
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-01T00:00:00+00:00',
            closesAt: '2026-06-02T00:00:00Z',
          },
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-03T00:00:00Z',
            closesAt: '2026-06-05T00:00:00Z',
          },
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-04T00:00:00Z',
            closesAt: '2026-06-06T00:00:00Z',
          },
        ],
        goalTypes: [
          { code: 'invalid/code', name: 'Invalid code', isOwnGoal: false, enabled: true },
          { code: 'A', name: 'Ordinary goal', isOwnGoal: false, enabled: true },
          { code: 'a', name: 'Another ordinary goal', isOwnGoal: false, enabled: true },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'registrationWindows[2].opensAt', code: 'overlap' }),
          expect.objectContaining({ field: 'goalTypes[2].code', code: 'isUnique' }),
        ]),
      }),
    );
  });

  it('requires the exact contiguous ranking criteria at completeness, not on partial save', () => {
    expect(
      validateDraftContent({ rankingPriority: [{ position: 2, criterionCode: 'POINTS' }] }),
    ).toMatchObject({ rankingPriority: [{ position: 2, criterionCode: 'POINTS' }] });

    expect(() =>
      validateCompleteRegulationContent({
        ...completeContent(),
        rankingPriority: [
          { position: 1, criterionCode: 'POINTS' },
          { position: 3, criterionCode: 'GOAL_DIFFERENCE' },
          { position: 4, criterionCode: 'GOALS_FOR' },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([expect.objectContaining({ field: 'rankingPriority' })]),
      }),
    );
  });

  it('validates a complete explicitly supplied test configuration without applying fixture defaults', () => {
    expect(validateCompleteRegulationContent(completeContent())).toMatchObject({
      squadLimit: 25,
      nonHomegrownLimit: 17,
      u21Cutoff: '2005-01-01',
      plannedMinutes: 120,
      qualificationCount: 4,
      relegationCount: 3,
    });
  });

  it('applies only the approved relegation default for a 20-club complete configuration', () => {
    const content = completeContent();
    content.relegationCount = null;
    expect(validateCompleteRegulationContent(content).relegationCount).toBe(3);

    expect(() =>
      validateCompleteRegulationContent({
        ...completeContent(),
        clubCount: 18,
        relegationCount: null,
      }),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([expect.objectContaining({ field: 'relegationCount' })]),
      }),
    );
  });

  it('keeps supplied baseline meanings fixed without requiring every baseline catalog code', () => {
    const custom = completeContent();
    custom.goalTypes = [
      { code: 'SPECIAL', name: 'Special scoring event', isOwnGoal: false, enabled: true },
    ];
    custom.cardTypes = [
      { code: 'DISCIPLINE', name: 'Discipline', meaning: 'YELLOW', enabled: true },
    ];
    expect(validateCompleteRegulationContent(custom).goalTypes).toEqual(custom.goalTypes);

    expect(() =>
      validateDraftContent({
        goalTypes: [{ code: 'C', name: 'Own goal', isOwnGoal: false, enabled: true }],
      }),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'goalTypes[0].isOwnGoal' }),
        ]),
      }),
    );
  });

  it('does not invent a points floor while enforcing strict ordering', () => {
    expect(validateDraftContent({ winPoints: 1, drawPoints: 0, lossPoints: -1 })).toMatchObject({
      winPoints: 1,
      drawPoints: 0,
      lossPoints: -1,
    });
    expect(() => validateDraftContent({ winPoints: 0, drawPoints: 1, lossPoints: -1 })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }),
    );
  });

  it('does not accept caller-supplied child IDs or unknown nested properties', () => {
    expect(() =>
      validateDraftContent({
        registrationWindows: [
          {
            id: 'f0a03c18-28ca-487e-aee2-3ace410b453c',
            intakeKind: 'CLUB_APPLICATION',
            opensAt: '2026-06-01T00:00:00Z',
            closesAt: '2026-07-01T00:00:00Z',
          },
        ],
      } as never),
    ).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'registrationWindows[0].id' }),
        ]),
      }),
    );
  });
});
