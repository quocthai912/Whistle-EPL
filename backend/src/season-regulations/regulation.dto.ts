import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Min,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  GoalTypeInput,
  CardTypeInput,
  RankingPriorityInput,
  RegistrationWindowInput,
  RegulationDraftContent,
} from './regulation-validation';
import {
  regulationCardMeanings,
  regulationEffectiveModes,
  regulationIntakeKinds,
  regulationRankingCriteria,
} from './regulation-validation';

const whenNotNull = (_object: object, value: unknown) => value !== undefined && value !== null;
const whenDefined = (_object: object, value: unknown) => value !== undefined;

export class RegistrationWindowDto implements RegistrationWindowInput {
  @IsIn(regulationIntakeKinds)
  intakeKind!: RegistrationWindowInput['intakeKind'];

  @IsString()
  opensAt!: string;

  @IsString()
  closesAt!: string;
}

export class RankingPriorityDto implements RankingPriorityInput {
  @IsInt()
  @Min(1)
  position!: number;

  @IsIn(regulationRankingCriteria)
  criterionCode!: RankingPriorityInput['criterionCode'];
}

export class GoalTypeDto implements GoalTypeInput {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  isOwnGoal!: boolean;

  @IsBoolean()
  enabled!: boolean;
}

export class CardTypeDto implements CardTypeInput {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsIn(regulationCardMeanings)
  meaning!: CardTypeInput['meaning'];

  @IsBoolean()
  enabled!: boolean;
}

/** Nullable, partial content is valid while a version remains an editable draft. */
export class RegulationDraftContentDto implements RegulationDraftContent {
  @ValidateIf(whenNotNull)
  @IsIn(regulationEffectiveModes)
  effectiveMode?: RegulationDraftContent['effectiveMode'];

  @ValidateIf(whenNotNull)
  @IsString()
  proposedEffectiveAt?: RegulationDraftContent['proposedEffectiveAt'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  squadLimit?: RegulationDraftContent['squadLimit'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  nonHomegrownLimit?: RegulationDraftContent['nonHomegrownLimit'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(1)
  homegrownSeasons?: RegulationDraftContent['homegrownSeasons'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(1)
  homegrownMonths?: RegulationDraftContent['homegrownMonths'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(1)
  homegrownAgeStart?: RegulationDraftContent['homegrownAgeStart'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(1)
  homegrownAgeEnd?: RegulationDraftContent['homegrownAgeEnd'];

  @ValidateIf(whenNotNull)
  @IsString()
  u21Cutoff?: RegulationDraftContent['u21Cutoff'];

  @ValidateIf(whenDefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationWindowDto)
  registrationWindows?: RegistrationWindowDto[];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(4)
  clubCount?: RegulationDraftContent['clubCount'];

  @ValidateIf(whenNotNull)
  @IsIn(['DOUBLE_ROUND_ROBIN'])
  formatCode?: RegulationDraftContent['formatCode'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(2)
  legs?: RegulationDraftContent['legs'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(1)
  plannedMinutes?: RegulationDraftContent['plannedMinutes'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  preparationMinutes?: RegulationDraftContent['preparationMinutes'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  releaseMinutes?: RegulationDraftContent['releaseMinutes'];

  // The approved contract does not add a floor to any points field.
  @ValidateIf(whenNotNull)
  @IsInt()
  winPoints?: RegulationDraftContent['winPoints'];

  @ValidateIf(whenNotNull)
  @IsInt()
  drawPoints?: RegulationDraftContent['drawPoints'];

  @ValidateIf(whenNotNull)
  @IsInt()
  lossPoints?: RegulationDraftContent['lossPoints'];

  @ValidateIf(whenDefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RankingPriorityDto)
  rankingPriority?: RankingPriorityDto[];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  qualificationCount?: RegulationDraftContent['qualificationCount'];

  @ValidateIf(whenNotNull)
  @IsInt()
  @Min(0)
  relegationCount?: RegulationDraftContent['relegationCount'];

  @ValidateIf(whenDefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalTypeDto)
  goalTypes?: GoalTypeDto[];

  @ValidateIf(whenDefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardTypeDto)
  cardTypes?: CardTypeDto[];
}

export class CreateRegulationDraftDto extends RegulationDraftContentDto {
  @ValidateIf(whenDefined)
  @IsUUID('4')
  predecessorVersionId?: string;
}

export class UpdateRegulationDraftDto extends RegulationDraftContentDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;
}

/** Exact version action input. The owning transition requires the target where its action needs it. */
export class RegulationVersionActionDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsUUID('4')
  submittedVersionId?: string;

  @IsOptional()
  @IsUUID('4')
  expectedCurrentVersionId?: string | null;
}
