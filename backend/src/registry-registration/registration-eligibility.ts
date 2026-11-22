import type { LockResource, TransactionContext } from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import {
  evaluateQuotaAcrossIntervals,
  findPlayerOverlapConflicts,
  findShirtNumberConflicts,
  isValidPlayingInterval,
  isValidShirtNumber,
  loadCompetitionAndClubIntervals,
  SHIRT_NUMBER_MAX,
  SHIRT_NUMBER_MIN,
  type ExistingRegistrationInterval,
  type PlayerOverlapConflict,
  type QuotaCompositionBoundary,
  type ShirtNumberConflict,
} from './registration-intervals';
import { formatDateOnly } from './registration-validation';

/** Documented QĐ1.2 / D054 source reference defaults; never synthesized when regulation fields are missing. */
export const SOURCE_DEFAULT_SQUAD_LIMIT = 25;
export const SOURCE_DEFAULT_NON_HOMEGROWN_LIMIT = 17;
export const SOURCE_DEFAULT_HOMEGROWN_SEASONS = 3;
export const SOURCE_DEFAULT_HOMEGROWN_MONTHS = 36;

export type EligibilityFindingStatus = 'MET' | 'UNMET' | 'INSUFFICIENT_BASIS' | 'NOT_APPLICABLE';

export type EligibilityCriterionCode =
  | 'EFFECTIVE_REGULATION'
  | 'CLUB_PARTICIPATION'
  | 'RECEIPT_TIMING'
  | 'U21_CLASSIFICATION'
  | 'HOMEGROWN_VERIFICATION'
  | 'PLAYING_INTERVAL'
  | 'PLAYER_OVERLAP'
  | 'SHIRT_NUMBER'
  | 'SQUAD_LIMIT'
  | 'NON_HOMEGROWN_LIMIT';

export type EligibilityCriterionFinding = {
  criterion: EligibilityCriterionCode;
  status: EligibilityFindingStatus;
  reason: string;
  regulationVersionId: string | null;
  details?: Record<string, unknown>;
};

export type EligibilityRegulationBasis = {
  id: string;
  seasonId: string;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21CutoffIso: string | null;
};

export type HomegrownEvidenceBranch = 'SEASONS' | 'MONTHS';

export type HomegrownEvidenceInput = {
  evidenceBranch: HomegrownEvidenceBranch | null;
  qualifyingValue: number | null;
  evidenceSummary: string | null;
  evidenceReference: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  verifiedRegulationVersionId: string | null;
  affiliatedAssociationBasis: boolean | null;
};

export type EligibilityAssessmentInput = {
  mode: 'PRECHECK' | 'CONFIRMATION';
  seasonId: string;
  clubId: string;
  playerId: string;
  regulation: EligibilityRegulationBasis | null;
  clubParticipation: {
    clubExists: boolean;
    hasApprovedApplication: boolean;
    acceptedApplicationVersionId: string | null;
    clubDiscontinued: boolean;
  };
  receipt: {
    versionOwnershipMismatch?: boolean;
    receivedAt: Date | null;
    receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
    receiptRegulationVersionId: string | null;
    receiptWindowId: string | null;
    approvedExceptionVersionId: string | null;
  };
  player: {
    id: string;
    birthDateIso: string | null;
  };
  candidate: {
    registrationId?: string;
    excludeRegistrationIds?: readonly string[];
    shirtNumber: number | null;
    playingStart: Date | null;
    playingEnd: Date | null;
    nonHomegrownOptIn: boolean;
    homegrownEvidence: HomegrownEvidenceInput | null;
  };
  existingPlayerIntervals: readonly ExistingRegistrationInterval[];
  existingClubSeasonIntervals: readonly ExistingRegistrationInterval[];
};

export type RegistrationEligibilityAssessment = {
  mode: 'PRECHECK' | 'CONFIRMATION';
  eligibleForConfirmation: boolean;
  regulationVersionId: string | null;
  receiptRegulationVersionId: string | null;
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  criteria: EligibilityCriterionFinding[];
  blockingCriteria: EligibilityCriterionFinding[];
  playerConflicts: PlayerOverlapConflict[];
  shirtConflicts: ShirtNumberConflict[];
  breachedBoundaries: QuotaCompositionBoundary[];
};

function collectExcludedRegistrationIds(
  registrationId?: string,
  excludeRegistrationIds?: readonly string[],
): string[] {
  return [
    ...new Set([...(excludeRegistrationIds ?? []), ...(registrationId ? [registrationId] : [])]),
  ];
}

/** Evaluates D054 U21 qualification strictly by calendar-date comparison (birthDate >= u21Cutoff). */
export function evaluateU21Classification(
  playerBirthDateIso: string | null,
  regulation: EligibilityRegulationBasis | null,
): { u21Finding: boolean | null; finding: EligibilityCriterionFinding } {
  const regId = regulation?.id ?? null;
  if (!regulation || !regulation.u21CutoffIso) {
    return {
      u21Finding: null,
      finding: {
        criterion: 'U21_CLASSIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason: 'Thiếu mốc ngày sinh U21 trong quy định mùa giải đang có hiệu lực.',
        regulationVersionId: regId,
      },
    };
  }
  if (!playerBirthDateIso) {
    return {
      u21Finding: null,
      finding: {
        criterion: 'U21_CLASSIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason: 'Thiếu ngày sinh của cầu thủ nên không đủ căn cứ kết luận điều kiện U21.',
        regulationVersionId: regId,
      },
    };
  }

  const qualifies = playerBirthDateIso >= regulation.u21CutoffIso;
  if (qualifies) {
    return {
      u21Finding: true,
      finding: {
        criterion: 'U21_CLASSIFICATION',
        status: 'MET',
        reason: `Cầu thủ sinh ngày ${playerBirthDateIso}, đạt điều kiện U21 (từ ngày ${regulation.u21CutoffIso} trở về sau) và không tính vào danh sách giới hạn đội hình.`,
        regulationVersionId: regId,
        details: { birthDate: playerBirthDateIso, u21Cutoff: regulation.u21CutoffIso },
      },
    };
  }

  return {
    u21Finding: false,
    finding: {
      criterion: 'U21_CLASSIFICATION',
      status: 'NOT_APPLICABLE',
      reason: `Cầu thủ sinh ngày ${playerBirthDateIso}, trước mốc U21 (${regulation.u21CutoffIso}); áp dụng kiểm tra giới hạn đội hình tiêu chuẩn.`,
      regulationVersionId: regId,
      details: { birthDate: playerBirthDateIso, u21Cutoff: regulation.u21CutoffIso },
    },
  };
}

/** Evaluates D054 evidence-based staff verification of homegrown status (never inferred from nationality). */
export function evaluateHomegrownVerification(
  evidence: HomegrownEvidenceInput | null,
  nonHomegrownOptIn: boolean,
  regulation: EligibilityRegulationBasis | null,
  options: { u21Finding?: boolean | null } = {},
): { homegrownFinding: boolean | null; finding: EligibilityCriterionFinding } {
  const regId = regulation?.id ?? null;
  if (!regulation) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason: 'Thiếu phiên bản quy định đang có hiệu lực để đánh giá tiêu chí đào tạo nội địa.',
        regulationVersionId: null,
      },
    };
  }

  if (nonHomegrownOptIn) {
    return {
      homegrownFinding: false,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'NOT_APPLICABLE',
        reason:
          'Cán bộ chọn xử lý theo diện không đạt tiêu chí đào tạo nội địa (non-homegrown); áp dụng giới hạn cầu thủ ngoài diện nội địa nếu không thuộc U21.',
        regulationVersionId: regId,
        details: { nonHomegrownOptIn: true },
      },
    };
  }

  if (!evidence && options.u21Finding === true) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'NOT_APPLICABLE',
        reason:
          'Cầu thủ đạt diện U21 nên không bắt buộc xác minh tiêu chí đào tạo nội địa để loại trừ khỏi giới hạn đội hình.',
        regulationVersionId: regId,
      },
    };
  }

  if (regulation.homegrownAgeStart === null || regulation.homegrownAgeEnd === null) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason: 'Thiếu cấu hình khung độ tuổi đào tạo nội địa trong quy định đang có hiệu lực.',
        regulationVersionId: regId,
      },
    };
  }

  if (!evidence) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Thiếu minh chứng xác minh đào tạo nội địa theo D054; cần bổ sung hồ sơ xác minh hoặc chọn xử lý diện không đạt tiêu chí nội địa.',
        regulationVersionId: regId,
      },
    };
  }

  const branch = evidence.evidenceBranch;
  const validBranch = branch === 'SEASONS' || branch === 'MONTHS';
  const validValue =
    typeof evidence.qualifyingValue === 'number' &&
    Number.isInteger(evidence.qualifyingValue) &&
    evidence.qualifyingValue >= 0;
  const hasSummary =
    typeof evidence.evidenceSummary === 'string' && evidence.evidenceSummary.trim().length > 0;
  const hasReference =
    typeof evidence.evidenceReference === 'string' && evidence.evidenceReference.trim().length > 0;
  const hasVerifier =
    typeof evidence.verifiedBy === 'string' && evidence.verifiedBy.trim().length > 0;
  const hasVerifiedAt =
    evidence.verifiedAt instanceof Date && Number.isFinite(evidence.verifiedAt.getTime());

  if (
    !validBranch ||
    !validValue ||
    !hasSummary ||
    !hasReference ||
    !hasVerifier ||
    !hasVerifiedAt
  ) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Hồ sơ xác minh đào tạo nội địa chưa đầy đủ căn cứ bắt buộc (nhánh mùa/tháng, giá trị, tóm tắt, mã tham chiếu, người và thời điểm xác minh).',
        regulationVersionId: regId,
      },
    };
  }

  if (
    !evidence.verifiedRegulationVersionId ||
    evidence.verifiedRegulationVersionId !== regulation.id
  ) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Kết quả xác minh đào tạo nội địa không khớp phiên bản quy định đang có hiệu lực tại thời điểm quyết định; cần xác minh lại.',
        regulationVersionId: regId,
        details: {
          verifiedRegulationVersionId: evidence.verifiedRegulationVersionId,
          effectiveRegulationVersionId: regulation.id,
        },
      },
    };
  }

  if (
    evidence.affiliatedAssociationBasis === null ||
    evidence.affiliatedAssociationBasis === undefined
  ) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Thiếu xác nhận điều kiện đào tạo tại câu lạc bộ thuộc liên đoàn bóng đá Anh hoặc Xứ Wales theo D054.',
        regulationVersionId: regId,
      },
    };
  }

  if (evidence.affiliatedAssociationBasis === false) {
    return {
      homegrownFinding: false,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'UNMET',
        reason:
          'Cầu thủ không đáp ứng điều kiện đào tạo tại câu lạc bộ thuộc liên đoàn bóng đá Anh hoặc Xứ Wales theo khung tuổi quy định (quốc tịch không thay thế căn cứ đào tạo).',
        regulationVersionId: regId,
        details: {
          evidenceBranch: branch,
          qualifyingValue: evidence.qualifyingValue,
          affiliatedAssociationBasis: false,
        },
      },
    };
  }

  const requiredThreshold =
    branch === 'SEASONS' ? regulation.homegrownSeasons : regulation.homegrownMonths;
  if (requiredThreshold === null) {
    return {
      homegrownFinding: null,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'INSUFFICIENT_BASIS',
        reason:
          branch === 'SEASONS'
            ? 'Thiếu ngưỡng số mùa giải đào tạo nội địa trong quy định đang có hiệu lực.'
            : 'Thiếu ngưỡng số tháng đào tạo nội địa trong quy định đang có hiệu lực.',
        regulationVersionId: regId,
      },
    };
  }

  if (evidence.qualifyingValue! >= requiredThreshold) {
    return {
      homegrownFinding: true,
      finding: {
        criterion: 'HOMEGROWN_VERIFICATION',
        status: 'MET',
        reason:
          branch === 'SEASONS'
            ? `Đạt tiêu chí đào tạo nội địa theo nhánh mùa giải (${evidence.qualifyingValue}/${requiredThreshold} mùa, độ tuổi ${regulation.homegrownAgeStart}–${regulation.homegrownAgeEnd}).`
            : `Đạt tiêu chí đào tạo nội địa theo nhánh tháng (${evidence.qualifyingValue}/${requiredThreshold} tháng, độ tuổi ${regulation.homegrownAgeStart}–${regulation.homegrownAgeEnd}).`,
        regulationVersionId: regId,
        details: {
          evidenceBranch: branch,
          qualifyingValue: evidence.qualifyingValue,
          requiredThreshold,
          ageStart: regulation.homegrownAgeStart,
          ageEnd: regulation.homegrownAgeEnd,
        },
      },
    };
  }

  return {
    homegrownFinding: false,
    finding: {
      criterion: 'HOMEGROWN_VERIFICATION',
      status: 'UNMET',
      reason:
        branch === 'SEASONS'
          ? `Không đạt ngưỡng đào tạo nội địa theo nhánh mùa giải (${evidence.qualifyingValue}/${requiredThreshold} mùa). Có thể chọn xử lý diện không đạt nội địa nếu còn hạn mức.`
          : `Không đạt ngưỡng đào tạo nội địa theo nhánh tháng (${evidence.qualifyingValue}/${requiredThreshold} tháng). Có thể chọn xử lý diện không đạt nội địa nếu còn hạn mức.`,
      regulationVersionId: regId,
      details: {
        evidenceBranch: branch,
        qualifyingValue: evidence.qualifyingValue,
        requiredThreshold,
      },
    },
  };
}

function evaluateClubParticipation(
  clubParticipation: EligibilityAssessmentInput['clubParticipation'],
  regId: string | null,
): EligibilityCriterionFinding {
  if (!clubParticipation.clubExists) {
    return {
      criterion: 'CLUB_PARTICIPATION',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Không tìm thấy thông tin câu lạc bộ để đánh giá điều kiện tham gia mùa giải.',
      regulationVersionId: regId,
    };
  }
  if (clubParticipation.clubDiscontinued) {
    return {
      criterion: 'CLUB_PARTICIPATION',
      status: 'UNMET',
      reason: 'Câu lạc bộ đã ngừng hoạt động theo D099 và không thể xác nhận đăng ký cầu thủ mới.',
      regulationVersionId: regId,
    };
  }
  if (!clubParticipation.hasApprovedApplication) {
    return {
      criterion: 'CLUB_PARTICIPATION',
      status: 'UNMET',
      reason:
        'Hồ sơ đăng ký tham gia mùa giải (BM1) của câu lạc bộ chưa được phê duyệt; chỉ được chuẩn bị/kiểm tra trước, chưa thể xác nhận hiệu lực.',
      regulationVersionId: regId,
    };
  }
  return {
    criterion: 'CLUB_PARTICIPATION',
    status: 'MET',
    reason: 'Câu lạc bộ đã có hồ sơ tham gia mùa giải được phê duyệt và đang hoạt động.',
    regulationVersionId: regId,
    details: { acceptedApplicationVersionId: clubParticipation.acceptedApplicationVersionId },
  };
}

function evaluateReceiptTiming(
  mode: 'PRECHECK' | 'CONFIRMATION',
  receipt: EligibilityAssessmentInput['receipt'],
): EligibilityCriterionFinding {
  if (receipt.versionOwnershipMismatch) {
    return {
      criterion: 'RECEIPT_TIMING',
      status: 'UNMET',
      reason:
        'Phiên bản đăng ký tham chiếu không thuộc đúng mùa giải, câu lạc bộ hoặc cầu thủ đang kiểm tra.',
      regulationVersionId: null,
    };
  }
  if (!receipt.receivedAt || !receipt.receiptTimingStatus) {
    if (mode === 'PRECHECK') {
      return {
        criterion: 'RECEIPT_TIMING',
        status: 'NOT_APPLICABLE',
        reason:
          'Hồ sơ chưa thực hiện tiếp nhận; điều kiện khung thời gian sẽ được đánh giá tại thời điểm tiếp nhận.',
        regulationVersionId: receipt.receiptRegulationVersionId,
      };
    }
    return {
      criterion: 'RECEIPT_TIMING',
      status: 'UNMET',
      reason: 'Phiên bản đăng ký chưa được tiếp nhận hợp lệ trước khi xác nhận.',
      regulationVersionId: receipt.receiptRegulationVersionId,
    };
  }
  if (receipt.receiptTimingStatus === 'ON_TIME') {
    return {
      criterion: 'RECEIPT_TIMING',
      status: 'MET',
      reason:
        'Phiên bản đăng ký được tiếp nhận đúng khung thời gian theo quy định tại thời điểm tiếp nhận.',
      regulationVersionId: receipt.receiptRegulationVersionId,
      details: {
        receivedAt: receipt.receivedAt.toISOString(),
        receiptWindowId: receipt.receiptWindowId,
      },
    };
  }
  if (receipt.approvedExceptionVersionId) {
    return {
      criterion: 'RECEIPT_TIMING',
      status: 'MET',
      reason:
        'Phiên bản đăng ký tiếp nhận ngoài hạn nhưng đã có ngoại lệ tiếp nhận D053 được phê duyệt cho đúng phiên bản này.',
      regulationVersionId: receipt.receiptRegulationVersionId,
      details: {
        receivedAt: receipt.receivedAt.toISOString(),
        approvedExceptionVersionId: receipt.approvedExceptionVersionId,
      },
    };
  }
  return {
    criterion: 'RECEIPT_TIMING',
    status: 'UNMET',
    reason:
      'Phiên bản đăng ký tiếp nhận ngoài khung thời gian quy định và chưa có ngoại lệ D053 được phê duyệt.',
    regulationVersionId: receipt.receiptRegulationVersionId,
    details: { receivedAt: receipt.receivedAt.toISOString() },
  };
}

/** Pure explainable UC11 assessment across all registration eligibility, interval, shirt and quota criteria. */
export function assessRegistrationEligibility(
  input: EligibilityAssessmentInput,
): RegistrationEligibilityAssessment {
  // Never substitute another season's regulation (UC11 Exception 2 / FR-013).
  const reg =
    input.regulation && input.regulation.seasonId === input.seasonId ? input.regulation : null;
  const regId = reg?.id ?? null;
  const squadLimit = reg?.squadLimit ?? null;
  const nonHomegrownLimit = reg?.nonHomegrownLimit ?? null;
  const criteria: EligibilityCriterionFinding[] = [];

  // 1. Effective regulation (FR-013, FR-025)
  if (!reg) {
    criteria.push({
      criterion: 'EFFECTIVE_REGULATION',
      status: 'UNMET',
      reason: 'Mùa giải chưa có phiên bản quy định hợp lệ đang có hiệu lực.',
      regulationVersionId: null,
    });
  } else {
    criteria.push({
      criterion: 'EFFECTIVE_REGULATION',
      status: 'MET',
      reason: 'Đã xác định phiên bản quy định đang có hiệu lực của mùa giải.',
      regulationVersionId: regId,
    });
  }

  // 2. Club participation & D099 availability (FR-012, FR-025)
  criteria.push(evaluateClubParticipation(input.clubParticipation, regId));

  // 3. Receipt timing & D053 exception (FR-010, FR-011)
  criteria.push(evaluateReceiptTiming(input.mode, input.receipt));

  // 4. U21 classification (FR-014, D054)
  const u21Eval = evaluateU21Classification(input.player.birthDateIso, reg);
  criteria.push(u21Eval.finding);

  // 5. Homegrown verification (FR-014, D054)
  const hgEval = evaluateHomegrownVerification(
    input.candidate.homegrownEvidence,
    input.candidate.nonHomegrownOptIn,
    reg,
    { u21Finding: u21Eval.u21Finding },
  );
  criteria.push(hgEval.finding);

  // 6. Playing interval validity (FR-016, FR-017, D056)
  const hasStart = input.candidate.playingStart !== null;
  const intervalValid =
    hasStart &&
    isValidPlayingInterval({
      start: input.candidate.playingStart!,
      end: input.candidate.playingEnd,
    });
  if (!hasStart) {
    criteria.push({
      criterion: 'PLAYING_INTERVAL',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Thiếu thời điểm bắt đầu hiệu lực thi đấu của đăng ký.',
      regulationVersionId: regId,
    });
  } else if (!intervalValid) {
    criteria.push({
      criterion: 'PLAYING_INTERVAL',
      status: 'UNMET',
      reason:
        'Khoảng thời gian hiệu lực thi đấu [bắt đầu, kết thúc) không hợp lệ (thời điểm kết thúc phải lớn hơn thời điểm bắt đầu).',
      regulationVersionId: regId,
    });
  } else {
    criteria.push({
      criterion: 'PLAYING_INTERVAL',
      status: 'MET',
      reason: 'Khoảng thời gian hiệu lực thi đấu hợp lệ theo quy ước nửa mở [bắt đầu, kết thúc).',
      regulationVersionId: regId,
      details: {
        playingStart: input.candidate.playingStart!.toISOString(),
        playingEnd: input.candidate.playingEnd ? input.candidate.playingEnd.toISOString() : null,
      },
    });
  }

  const excludeIds = collectExcludedRegistrationIds(
    input.candidate.registrationId,
    input.candidate.excludeRegistrationIds,
  );

  // 7. Competition-wide player overlap (FR-016, D056)
  let playerConflicts: PlayerOverlapConflict[] = [];
  if (!intervalValid) {
    criteria.push({
      criterion: 'PLAYER_OVERLAP',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Chưa thể kiểm tra chồng lấn đăng ký cầu thủ do khoảng hiệu lực thi đấu chưa hợp lệ.',
      regulationVersionId: regId,
    });
  } else {
    playerConflicts = findPlayerOverlapConflicts(
      {
        playerId: input.playerId,
        seasonId: input.seasonId,
        playingStart: input.candidate.playingStart!,
        playingEnd: input.candidate.playingEnd,
        excludeRegistrationIds: excludeIds,
      },
      input.existingPlayerIntervals,
    );
    if (playerConflicts.length > 0) {
      const hasCrossSeason = playerConflicts.some((c) => c.crossSeason);
      criteria.push({
        criterion: 'PLAYER_OVERLAP',
        status: 'UNMET',
        reason: hasCrossSeason
          ? 'Cầu thủ có đăng ký hiệu lực chồng lấn trên toàn giải (bao gồm khác mùa giải).'
          : 'Cầu thủ đã có đăng ký hiệu lực chồng lấn trong cùng khoảng thời gian.',
        regulationVersionId: regId,
        details: { conflicts: playerConflicts },
      });
    } else {
      criteria.push({
        criterion: 'PLAYER_OVERLAP',
        status: 'MET',
        reason: 'Không phát hiện chồng lấn khoảng hiệu lực thi đấu của cầu thủ trên toàn giải.',
        regulationVersionId: regId,
      });
    }
  }

  // 8. Shirt number 1-99 and club-season temporal uniqueness (FR-016, D058)
  let shirtConflicts: ShirtNumberConflict[] = [];
  if (input.candidate.shirtNumber === null || input.candidate.shirtNumber === undefined) {
    criteria.push({
      criterion: 'SHIRT_NUMBER',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Thiếu số áo đăng ký của cầu thủ.',
      regulationVersionId: regId,
    });
  } else if (!isValidShirtNumber(input.candidate.shirtNumber)) {
    criteria.push({
      criterion: 'SHIRT_NUMBER',
      status: 'UNMET',
      reason: `Số áo phải là số nguyên trong khoảng ${SHIRT_NUMBER_MIN}–${SHIRT_NUMBER_MAX}.`,
      regulationVersionId: regId,
      details: { shirtNumber: input.candidate.shirtNumber },
    });
  } else if (!intervalValid) {
    criteria.push({
      criterion: 'SHIRT_NUMBER',
      status: 'INSUFFICIENT_BASIS',
      reason:
        'Chưa thể kiểm tra trùng số áo theo thời gian do khoảng hiệu lực thi đấu chưa hợp lệ.',
      regulationVersionId: regId,
    });
  } else {
    shirtConflicts = findShirtNumberConflicts(
      {
        seasonId: input.seasonId,
        clubId: input.clubId,
        shirtNumber: input.candidate.shirtNumber,
        playingStart: input.candidate.playingStart!,
        playingEnd: input.candidate.playingEnd,
        excludeRegistrationIds: excludeIds,
      },
      input.existingClubSeasonIntervals,
    );
    if (shirtConflicts.length > 0) {
      criteria.push({
        criterion: 'SHIRT_NUMBER',
        status: 'UNMET',
        reason: `Số áo ${input.candidate.shirtNumber} đã được cấp phát trong cùng câu lạc bộ và mùa giải ở khoảng thời gian chồng lấn.`,
        regulationVersionId: regId,
        details: { shirtNumber: input.candidate.shirtNumber, conflicts: shirtConflicts },
      });
    } else {
      criteria.push({
        criterion: 'SHIRT_NUMBER',
        status: 'MET',
        reason: `Số áo ${input.candidate.shirtNumber} hợp lệ và không trùng lặp theo thời gian trong câu lạc bộ.`,
        regulationVersionId: regId,
      });
    }
  }

  // 9 & 10. Squad limit & Non-homegrown limit across all affected composition boundaries (FR-015, D075)
  let breachedBoundaries: QuotaCompositionBoundary[] = [];
  if (!reg) {
    criteria.push({
      criterion: 'SQUAD_LIMIT',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Thiếu phiên bản quy định đang có hiệu lực để đánh giá giới hạn tổng số cầu thủ.',
      regulationVersionId: null,
    });
    criteria.push({
      criterion: 'NON_HOMEGROWN_LIMIT',
      status: 'INSUFFICIENT_BASIS',
      reason:
        'Thiếu phiên bản quy định đang có hiệu lực để đánh giá giới hạn cầu thủ ngoài diện đào tạo nội địa.',
      regulationVersionId: null,
    });
  } else if (u21Eval.u21Finding === true) {
    criteria.push({
      criterion: 'SQUAD_LIMIT',
      status: 'NOT_APPLICABLE',
      reason: 'Cầu thủ đạt diện U21 được loại trừ khỏi giới hạn danh sách đội hình chính.',
      regulationVersionId: regId,
    });
    criteria.push({
      criterion: 'NON_HOMEGROWN_LIMIT',
      status: 'NOT_APPLICABLE',
      reason: 'Cầu thủ đạt diện U21 được loại trừ khỏi giới hạn cầu thủ ngoài diện nội địa.',
      regulationVersionId: regId,
    });
  } else if (u21Eval.u21Finding === null || !intervalValid) {
    criteria.push({
      criterion: 'SQUAD_LIMIT',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Chưa đủ căn cứ phân loại U21 hoặc khoảng hiệu lực để đánh giá giới hạn đội hình.',
      regulationVersionId: regId,
    });
    criteria.push({
      criterion: 'NON_HOMEGROWN_LIMIT',
      status: 'INSUFFICIENT_BASIS',
      reason: 'Chưa đủ căn cứ phân loại để đánh giá giới hạn cầu thủ ngoài diện nội địa.',
      regulationVersionId: regId,
    });
  } else {
    const sweep = evaluateQuotaAcrossIntervals(
      {
        playingStart: input.candidate.playingStart!,
        playingEnd: input.candidate.playingEnd,
        u21: false,
        homegrown: hgEval.homegrownFinding,
        excludeRegistrationIds: excludeIds,
      },
      input.existingClubSeasonIntervals,
      { squadLimit, nonHomegrownLimit },
    );

    if (squadLimit === null) {
      criteria.push({
        criterion: 'SQUAD_LIMIT',
        status: 'INSUFFICIENT_BASIS',
        reason: 'Thiếu cấu hình giới hạn tổng số cầu thủ trong quy định đang có hiệu lực.',
        regulationVersionId: regId,
      });
    } else if (sweep.squadBreaches.length > 0) {
      criteria.push({
        criterion: 'SQUAD_LIMIT',
        status: 'UNMET',
        reason: `Vượt giới hạn tổng số cầu thủ tính hạn mức (${squadLimit}) tại ít nhất một mốc thành phần đội hình (bao gồm kế hoạch tương lai).`,
        regulationVersionId: regId,
        details: { squadLimit, breaches: sweep.squadBreaches },
      });
    } else if (sweep.unresolvedU21Ids.length > 0) {
      criteria.push({
        criterion: 'SQUAD_LIMIT',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Tồn tại hồ sơ đăng ký hiện hữu trong cùng khoảng thời gian chưa đủ dữ liệu phân loại U21 để tính hạn mức.',
        regulationVersionId: regId,
        details: { unresolvedU21Ids: sweep.unresolvedU21Ids },
      });
    } else {
      criteria.push({
        criterion: 'SQUAD_LIMIT',
        status: 'MET',
        reason: `Đáp ứng giới hạn đội hình (${squadLimit} cầu thủ) trên toàn bộ các mốc thời gian bị ảnh hưởng.`,
        regulationVersionId: regId,
        details: { squadLimit, boundaryCount: sweep.boundaries.length },
      });
    }

    if (hgEval.homegrownFinding === true) {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'NOT_APPLICABLE',
        reason:
          'Cầu thủ đạt tiêu chí đào tạo nội địa nên không tính vào giới hạn cầu thủ ngoài diện nội địa.',
        regulationVersionId: regId,
      });
    } else if (hgEval.homegrownFinding === null) {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Chưa xác định được trạng thái đào tạo nội địa nên chưa thể kết luận giới hạn cầu thủ ngoài diện nội địa.',
        regulationVersionId: regId,
      });
    } else if (nonHomegrownLimit === null) {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Thiếu cấu hình giới hạn cầu thủ ngoài diện đào tạo nội địa trong quy định đang có hiệu lực.',
        regulationVersionId: regId,
      });
    } else if (sweep.nonHomegrownBreaches.length > 0) {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'UNMET',
        reason: `Vượt giới hạn cầu thủ ngoài diện đào tạo nội địa (${nonHomegrownLimit}) tại ít nhất một mốc thành phần đội hình (bao gồm kế hoạch tương lai).`,
        regulationVersionId: regId,
        details: { nonHomegrownLimit, breaches: sweep.nonHomegrownBreaches },
      });
    } else if (sweep.unresolvedU21Ids.length > 0 || sweep.unresolvedHomegrownIds.length > 0) {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'INSUFFICIENT_BASIS',
        reason:
          'Tồn tại hồ sơ đăng ký hiện hữu chưa đủ dữ liệu phân loại để tính giới hạn ngoài diện nội địa.',
        regulationVersionId: regId,
        details: {
          unresolvedU21Ids: sweep.unresolvedU21Ids,
          unresolvedHomegrownIds: sweep.unresolvedHomegrownIds,
        },
      });
    } else {
      criteria.push({
        criterion: 'NON_HOMEGROWN_LIMIT',
        status: 'MET',
        reason: `Đáp ứng giới hạn cầu thủ ngoài diện đào tạo nội địa (${nonHomegrownLimit}) trên toàn bộ các mốc thời gian bị ảnh hưởng.`,
        regulationVersionId: regId,
        details: { nonHomegrownLimit, boundaryCount: sweep.boundaries.length },
      });
    }

    const breachedMap = new Map<string, QuotaCompositionBoundary>();
    for (const b of [...sweep.squadBreaches, ...sweep.nonHomegrownBreaches]) {
      breachedMap.set(`${b.startsAt}|${b.endsAt ?? ''}`, b);
    }
    breachedBoundaries = [...breachedMap.values()];
  }

  // Under D054/FR-015, qualifying U21 players are outside the 25/17 quota, so optional
  // homegrown verification findings on a U21 candidate remain informational and do not block confirmation.
  const blockingCriteria = criteria.filter((c) => {
    if (c.status !== 'UNMET' && c.status !== 'INSUFFICIENT_BASIS') return false;
    if (u21Eval.u21Finding === true && c.criterion === 'HOMEGROWN_VERIFICATION') return false;
    return true;
  });

  return {
    mode: input.mode,
    eligibleForConfirmation: blockingCriteria.length === 0,
    regulationVersionId: regId,
    receiptRegulationVersionId: input.receipt.receiptRegulationVersionId,
    u21Finding: u21Eval.u21Finding,
    homegrownFinding: hgEval.homegrownFinding,
    squadLimit,
    nonHomegrownLimit,
    criteria,
    blockingCriteria,
    playerConflicts,
    shirtConflicts,
    breachedBoundaries,
  };
}

export type DbEligibilityEvaluationInput = {
  seasonId: string;
  clubId: string;
  playerId: string;
  registrationId?: string;
  versionId?: string;
  shirtNumber: number | null;
  playingStart: Date | null;
  playingEnd: Date | null;
  nonHomegrownOptIn: boolean;
  homegrownEvidence: HomegrownEvidenceInput | null;
};

type DbRegulationRow = {
  id: string;
  seasonId: string;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21Cutoff: Date | null;
};

function toRegulationBasis(row: DbRegulationRow | null): EligibilityRegulationBasis | null {
  if (!row) return null;
  return {
    id: row.id,
    seasonId: row.seasonId,
    squadLimit: row.squadLimit,
    nonHomegrownLimit: row.nonHomegrownLimit,
    homegrownSeasons: row.homegrownSeasons,
    homegrownMonths: row.homegrownMonths,
    homegrownAgeStart: row.homegrownAgeStart,
    homegrownAgeEnd: row.homegrownAgeEnd,
    u21CutoffIso: row.u21Cutoff ? formatDateOnly(row.u21Cutoff) : null,
  };
}

function requiredEligibilityLocks(
  input: Pick<DbEligibilityEvaluationInput, 'seasonId' | 'playerId' | 'clubId' | 'registrationId'>,
  mode: 'shared' | 'exclusive',
): LockResource[] {
  const locks: LockResource[] = [
    { kind: 'season', key: input.seasonId, mode },
    { kind: 'player', key: input.playerId, mode },
    { kind: 'club', key: input.clubId, mode },
  ];
  if (input.registrationId) {
    locks.push({ kind: 'playerRegistration', key: input.registrationId, mode });
  }
  return locks;
}

async function loadAndAssessAgainstDb(
  context: TransactionContext,
  mode: 'PRECHECK' | 'CONFIRMATION',
  regulation: EligibilityRegulationBasis | null,
  input: DbEligibilityEvaluationInput,
): Promise<RegistrationEligibilityAssessment> {
  const lockMode = mode === 'CONFIRMATION' ? 'exclusive' : 'shared';
  context.assertLockCoverage(requiredEligibilityLocks(input, lockMode));

  const [club, clubApp, player, version] = await Promise.all([
    context.db.club.findUnique({
      where: { id: input.clubId },
      select: { id: true, discontinuedAt: true },
    }),
    context.db.clubApplication.findUnique({
      where: { seasonId_clubId: { seasonId: input.seasonId, clubId: input.clubId } },
      select: { id: true, currentAcceptedVersionId: true },
    }),
    context.db.player.findUnique({
      where: { id: input.playerId },
      select: { id: true, birthDate: true },
    }),
    input.versionId
      ? context.db.registrationVersion.findUnique({
          where: { id: input.versionId },
          select: {
            id: true,
            seasonId: true,
            caseId: true,
            receivedAt: true,
            receiptTimingStatus: true,
            receiptRegulationVersionId: true,
            receiptWindowId: true,
            registration: {
              select: {
                id: true,
                seasonId: true,
                clubId: true,
                playerId: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const versionOwnershipMismatch =
    !!input.versionId &&
    (!version ||
      version.seasonId !== input.seasonId ||
      version.registration.seasonId !== input.seasonId ||
      version.registration.clubId !== input.clubId ||
      version.registration.playerId !== input.playerId ||
      (input.registrationId !== undefined && version.caseId !== input.registrationId));

  const ownedVersion = versionOwnershipMismatch ? null : version;
  // Derive self-exclusion strictly from the verified/locked registration lineage.
  const lockedRegistrationId = input.registrationId ?? ownedVersion?.caseId;
  const excludeIds = lockedRegistrationId ? [lockedRegistrationId] : [];

  const intervals = await loadCompetitionAndClubIntervals(context.db, {
    seasonId: input.seasonId,
    clubId: input.clubId,
    playerId: input.playerId,
    excludeRegistrationIds: excludeIds,
  });

  let approvedExceptionVersionId: string | null = null;
  if (ownedVersion && ownedVersion.receiptTimingStatus === 'LATE') {
    const approvedException = await context.db.receiptExceptionVersion.findFirst({
      where: {
        seasonId: input.seasonId,
        registrationVersionId: ownedVersion.id,
        state: 'APPROVED',
      },
      select: { id: true },
    });
    approvedExceptionVersionId = approvedException?.id ?? null;
  }

  return assessRegistrationEligibility({
    mode,
    seasonId: input.seasonId,
    clubId: input.clubId,
    playerId: input.playerId,
    regulation,
    clubParticipation: {
      clubExists: !!club,
      hasApprovedApplication: !!clubApp?.currentAcceptedVersionId,
      acceptedApplicationVersionId: clubApp?.currentAcceptedVersionId ?? null,
      clubDiscontinued: !!club && club.discontinuedAt !== null,
    },
    receipt: {
      versionOwnershipMismatch,
      receivedAt: ownedVersion?.receivedAt ?? null,
      receiptTimingStatus:
        ownedVersion?.receiptTimingStatus === 'ON_TIME' ||
        ownedVersion?.receiptTimingStatus === 'LATE'
          ? ownedVersion.receiptTimingStatus
          : null,
      receiptRegulationVersionId: ownedVersion?.receiptRegulationVersionId ?? null,
      receiptWindowId: ownedVersion?.receiptWindowId ?? null,
      approvedExceptionVersionId,
    },
    player: {
      id: input.playerId,
      birthDateIso: player ? formatDateOnly(player.birthDate) : null,
    },
    candidate: {
      registrationId: input.registrationId ?? ownedVersion?.caseId,
      excludeRegistrationIds: excludeIds,
      shirtNumber: input.shirtNumber,
      playingStart: input.playingStart,
      playingEnd: input.playingEnd,
      nonHomegrownOptIn: input.nonHomegrownOptIn,
      homegrownEvidence: input.homegrownEvidence,
    },
    existingPlayerIntervals: intervals.existingPlayerIntervals,
    existingClubSeasonIntervals: intervals.existingClubSeasonIntervals,
  });
}

/**
 * Read-only UC11 precheck: never activates due waiting regulations (fails with 503 if unresolved),
 * enforces shared season/player/club lock coverage, reserves no capacity, and reads live Player data.
 */
export async function precheckRegistrationEligibility(
  context: TransactionContext,
  activation: RegulationActivationService,
  input: DbEligibilityEvaluationInput,
): Promise<RegistrationEligibilityAssessment> {
  context.assertLockCoverage(requiredEligibilityLocks(input, 'shared'));
  await activation.requireResolvedBasis(context, input.seasonId);
  const season = await context.db.season.findUnique({
    where: { id: input.seasonId },
    select: {
      currentRegulationVersion: {
        select: {
          id: true,
          seasonId: true,
          state: true,
          squadLimit: true,
          nonHomegrownLimit: true,
          homegrownSeasons: true,
          homegrownMonths: true,
          homegrownAgeStart: true,
          homegrownAgeEnd: true,
          u21Cutoff: true,
        },
      },
    },
  });
  const effectiveRow =
    season?.currentRegulationVersion?.state === 'EFFECTIVE'
      ? season.currentRegulationVersion
      : null;

  return loadAndAssessAgainstDb(context, 'PRECHECK', toRegulationBasis(effectiveRow), input);
}

/**
 * Final in-transaction UC11 assessment for confirmation: enforces exclusive season/player/club locks,
 * consumes the caller-resolved decision-time regulation, and reads live Player/interval records.
 */
export async function evaluateRegistrationEligibilityForConfirmation(
  context: TransactionContext,
  regulation: DbRegulationRow,
  input: DbEligibilityEvaluationInput,
): Promise<RegistrationEligibilityAssessment> {
  return loadAndAssessAgainstDb(context, 'CONFIRMATION', toRegulationBasis(regulation), input);
}
