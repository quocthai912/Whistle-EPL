import { useEffect } from 'react';
import { useRegulationReviewContent } from './use-regulation-review-content';
import { formatSeasonInstant } from '../seasons/season-model';
import {
  formatRegulationDate,
  intakeKindLabels,
  rankingCriterionLabels,
  type CardType,
  type GoalType,
  type RegulationContent,
  type RegulationOverviewSummary,
} from './regulation-model';
import css from './RegulationVersionsPage.module.css';

export function RegulationReview({
  content,
  currentBasis,
  labelFor,
  onReady,
}: {
  content: RegulationContent;
  currentBasis: RegulationOverviewSummary | null;
  labelFor: (field: string) => string;
  onReady: (ready: boolean) => void;
}) {
  const basis = useRegulationReviewContent(currentBasis?.id);
  const previous = basis?.detail?.content;
  useEffect(() => {
    onReady(!currentBasis || Boolean(previous));
  }, [currentBasis, onReady, previous]);
  const differences = previous
    ? (Object.keys(content) as (keyof RegulationContent)[]).filter(
        (field) => JSON.stringify(previous[field]) !== JSON.stringify(content[field]),
      )
    : [];
  return (
    <>
      <p>
        {content.effectiveMode === 'IMMEDIATE'
          ? 'Quy định có hiệu lực khi hệ thống ghi nhận phê duyệt.'
          : 'Quy định chờ đến thời điểm hiệu lực đã đề xuất sau khi được phê duyệt.'}
      </p>
      {currentBasis ? (
        <section className={css.actionPreview} aria-label="Căn cứ đang hiệu lực">
          <h3>Căn cứ đang hiệu lực</h3>
          <p>
            Phiên bản {currentBasis.versionNumber} · {currentBasis.id}
          </p>
          {basis?.error && <p role="alert">{basis.error}</p>}
          {!basis && <p role="status">Đang tải nội dung đang hiệu lực…</p>}
          {previous && (
            <>
              <p>
                {differences.length
                  ? `Thay đổi: ${differences.map(labelFor).join(', ')}`
                  : 'Nội dung giống phiên bản đang hiệu lực.'}
              </p>
              <details>
                <summary>Xem nội dung đang hiệu lực</summary>
                <RegulationReadView content={previous} />
              </details>
            </>
          )}
        </section>
      ) : (
        <p>Mùa giải chưa có phiên bản đang hiệu lực.</p>
      )}
    </>
  );
}

export function RegulationActionPreview({
  content,
  heading,
}: {
  content: RegulationContent;
  heading: string;
}) {
  const effective =
    content.effectiveMode === 'IMMEDIATE'
      ? 'Hiệu lực ngay (đề xuất)'
      : content.effectiveMode === 'SCHEDULED' && content.proposedEffectiveAt
        ? `Theo lịch: ${formatSeasonInstant(content.proposedEffectiveAt)}`
        : 'Chưa có đề xuất hiệu lực';
  const number = (value: number | null) => (value === null ? '—' : String(value));
  const ageRange =
    content.homegrownAgeStart === null || content.homegrownAgeEnd === null
      ? '—'
      : `${content.homegrownAgeStart}–${content.homegrownAgeEnd}`;

  return (
    <section className={css.actionPreview} aria-label={heading}>
      <h3>{heading}</h3>
      <dl>
        <div>
          <dt>Hiệu lực đề xuất</dt>
          <dd>{effective}</dd>
        </div>
        <div>
          <dt>Đội hình · không thuộc diện đào tạo · độ tuổi đào tạo</dt>
          <dd>
            {number(content.squadLimit)} · {number(content.nonHomegrownLimit)} · {ageRange}
          </dd>
        </div>
        <div>
          <dt>Câu lạc bộ · thể thức · lượt</dt>
          <dd>
            {number(content.clubCount)} ·{' '}
            {content.formatCode === 'DOUBLE_ROUND_ROBIN' ? 'Vòng tròn hai lượt' : '—'} ·{' '}
            {number(content.legs)}
          </dd>
        </div>
        <div>
          <dt>Điểm thắng · hòa · thua</dt>
          <dd>
            {number(content.winPoints)} · {number(content.drawPoints)} ·{' '}
            {number(content.lossPoints)}
          </dd>
        </div>
        <div>
          <dt>Tiếp nhận · danh mục</dt>
          <dd>
            {content.registrationWindows.length} đợt · {content.goalTypes.length} loại bàn thắng ·{' '}
            {content.cardTypes.length} loại thẻ
          </dd>
        </div>
      </dl>
      <details>
        <summary>Xem toàn bộ nội dung đã lưu</summary>
        <RegulationReadView content={content} />
      </details>
    </section>
  );
}

export function RegulationReadView({ content }: { content: RegulationContent }) {
  const number = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : String(value);
  return (
    <div className={css.readGroups}>
      <ReadGroup title="Điều kiện đăng ký" number="01">
        <ReadPair label="Giới hạn danh sách cầu thủ" value={number(content.squadLimit)} />
        <ReadPair
          label="Cầu thủ không thuộc diện đào tạo trong nước"
          value={number(content.nonHomegrownLimit)}
        />
        <ReadPair label="Số mùa đào tạo" value={number(content.homegrownSeasons)} />
        <ReadPair label="Số tháng đào tạo" value={number(content.homegrownMonths)} />
        <ReadPair
          label="Độ tuổi đào tạo"
          value={
            content.homegrownAgeStart === null || content.homegrownAgeEnd === null
              ? '—'
              : `${content.homegrownAgeStart}–${content.homegrownAgeEnd}`
          }
        />
        <ReadPair label="Ngày sinh giới hạn U21" value={formatRegulationDate(content.u21Cutoff)} />
      </ReadGroup>
      <ReadGroup title="Cấu trúc và kế hoạch" number="02">
        <ReadPair label="Số câu lạc bộ" value={number(content.clubCount)} />
        <ReadPair
          label="Thể thức"
          value={content.formatCode === 'DOUBLE_ROUND_ROBIN' ? 'Vòng tròn hai lượt' : '—'}
        />
        <ReadPair label="Số lượt" value={number(content.legs)} />
        <ReadPair label="Thời lượng dự kiến" value={minutes(content.plannedMinutes)} />
        <ReadPair label="Thời gian chuẩn bị" value={minutes(content.preparationMinutes)} />
        <ReadPair label="Thời gian nghỉ sau trận" value={minutes(content.releaseMinutes)} />
      </ReadGroup>
      <ReadGroup title="Điểm và xếp hạng" number="03">
        <ReadPair
          label="Điểm thắng / hòa / thua"
          value={`${number(content.winPoints)} / ${number(content.drawPoints)} / ${number(content.lossPoints)}`}
        />
        <ReadPair label="Quyền tham dự (Q)" value={number(content.qualificationCount)} />
        <ReadPair label="Xuống hạng (R)" value={number(content.relegationCount)} />
        <ReadPair
          label="Thứ tự tiêu chí"
          value={
            content.rankingPriority.length
              ? [...content.rankingPriority]
                  .sort((a, b) => a.position - b.position)
                  .map((item) => rankingCriterionLabels[item.criterionCode])
                  .join(' → ')
              : '—'
          }
        />
      </ReadGroup>
      <ReadGroup title="Các đợt tiếp nhận" number="04">
        {content.registrationWindows.length ? (
          content.registrationWindows.map((window, index) => (
            <ReadPair
              key={`${window.intakeKind}-${index}`}
              label={`${intakeKindLabels[window.intakeKind]} · Đợt ${index + 1}`}
              value={`${formatSeasonInstant(window.opensAt)} – ${formatSeasonInstant(window.closesAt)}`}
            />
          ))
        ) : (
          <ReadPair label="Trạng thái" value="Chưa có đợt tiếp nhận được lưu." />
        )}
      </ReadGroup>
      <ReadGroup title="Danh mục sự kiện" number="05">
        <div className={css.catalogRead}>
          <ReadCatalog title="Loại bàn thắng" items={content.goalTypes} />
          <ReadCatalog title="Loại thẻ" items={content.cardTypes} />
        </div>
      </ReadGroup>
    </div>
  );
}

function ReadGroup({
  title,
  number,
  children,
}: {
  title: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <section className={css.readGroup}>
      <div className={css.groupHeading}>
        <div>
          <span className={css.step}>{number}</span>
          <h3>{title}</h3>
        </div>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

function ReadPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReadCatalog({ title, items }: { title: string; items: (GoalType | CardType)[] }) {
  return (
    <section>
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${item.code}-${index}`}>
              <strong>{item.code}</strong> · {item.name} {item.enabled ? '' : '(không cho chọn)'}
            </li>
          ))}
        </ul>
      ) : (
        <p>Chưa có dữ liệu được lưu.</p>
      )}
    </section>
  );
}

function minutes(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${value} phút`;
}
