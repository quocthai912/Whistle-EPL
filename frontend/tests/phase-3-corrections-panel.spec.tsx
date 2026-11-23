import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfficialCorrectionsPanel } from '../src/features/registrations/OfficialCorrectionsPanel';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../src/shared/http/use-session', () => {
  const client = { request };
  const session = { account: { id: 'manager-1' } };
  return { useSession: () => ({ client, session }) };
});

beforeEach(() => {
  request.mockReset();
});

describe('OfficialCorrectionsPanel', () => {
  it('renders player registration correction diff table and historical segments without technical codes', async () => {
    request.mockResolvedValue({
      data: {
        caseId: 'reg-case-1',
        seasonId: 'season-1',
        seasonState: 'OPEN',
        currentValidatedVersionId: 'ver-1',
        pendingSourceCorrection: {
          required: true,
          snapshotBirthDate: '2006-01-10',
          currentPlayerBirthDate: '2004-01-10',
        },
        items: [
          {
            id: 'corr-1',
            correctionCaseId: 'corr-case-1',
            versionNumber: 1,
            predecessorVersionId: null,
            revision: '2',
            state: 'SUBMITTED',
            preparedBy: 'officer-1',
            preparer: { id: 'officer-1', fullName: 'Trần Cán Bộ', personnelCode: 'RO01' },
            editorIds: ['officer-1'],
            submittedAt: '2026-09-15T02:30:00.000Z',
            decidedAt: null,
            decidedBy: null,
            decider: null,
            decisionReason: null,
            targetVersionId: 'ver-1',
            proposedVersionId: 'ver-2',
            reason: 'Đánh giá lại theo D057 và FR-020 cho BM1.',
            basis: 'Giấy khai sinh gốc.',
            disposition: 'RECORD_ERRONEOUS',
            beforeSummary: {
              versionId: 'ver-1',
              versionNumber: 1,
              shirtNumber: 21,
              playingStart: '2026-08-10T00:00:00.000Z',
              playingEnd: null,
              playerBirthDate: '2006-01-10',
              u21Finding: true,
              homegrownFinding: null,
              nonHomegrownOptIn: false,
              playingDisposition: 'ACTIVE',
            },
            afterSummary: {
              versionId: 'ver-2',
              versionNumber: 2,
              shirtNumber: 21,
              playingStart: '2026-08-10T00:00:00.000Z',
              playingEnd: null,
              playerBirthDate: '2004-01-10',
              u21Finding: false,
              homegrownFinding: false,
              nonHomegrownOptIn: true,
              playingDisposition: 'RECORDED_ERRONEOUS',
            },
            affectedReferences: {
              declared: [
                {
                  kind: 'OFFICIAL_RESULT',
                  referenceId: null,
                  note: 'Vòng 4 cho UC19',
                },
              ],
              uc19MatchReviewRequired: true,
            },
            segments: [
              {
                segmentOrder: 1,
                segmentStart: '2026-08-10T00:00:00.000Z',
                segmentEnd: '2026-09-01T00:00:00.000Z',
                regulationVersionId: 'r1',
                regulationVersionNumber: 1,
                outcome: 'MET',
                requiredDisposition: null,
                findings: {
                  squadLimit: 25,
                  nonHomegrownLimit: 17,
                  blockingCriteria: [],
                },
              },
              {
                segmentOrder: 2,
                segmentStart: '2026-09-01T00:00:00.000Z',
                segmentEnd: null,
                regulationVersionId: 'r2',
                regulationVersionNumber: 2,
                outcome: 'UNMET',
                requiredDisposition: 'RECORD_ERRONEOUS',
                findings: {
                  squadLimit: 24,
                  nonHomegrownLimit: 16,
                  blockingCriteria: [
                    {
                      criterion: 'SQUAD_LIMIT',
                      status: 'UNMET',
                      reason: 'Vượt giới hạn tổng số cầu thủ tính hạn mức (24).',
                    },
                  ],
                },
              },
            ],
          },
        ],
        capabilities: { canPrepare: false, canApprove: true },
      },
    });

    const { container } = render(
      <OfficialCorrectionsPanel
        mode="player-registration"
        caseId="reg-case-1"
        playerName="Lê Minh Khôi"
        clubName="Manchester United"
        seasonName="2026–2027"
        baseline={{
          versionId: 'ver-1',
          versionNumber: 1,
          receivedAt: '2026-08-06T00:00:00.000Z',
          shirtNumber: 21,
          playingStart: '2026-08-10T00:00:00.000Z',
          playingEnd: null,
          u21Finding: true,
          homegrownFinding: null,
          nonHomegrownOptIn: false,
          evidenceBranch: null,
          qualifyingValue: null,
          evidenceSummary: null,
          evidenceReference: null,
          affiliatedAssociationBasis: null,
          playingDisposition: 'ACTIVE',
          notes: null,
        }}
        onChanged={() => undefined}
      />,
    );

    expect(await screen.findByText('Đề xuất lần 1 · Chờ phê duyệt')).toBeVisible();
    expect(
      screen.getByText(/Hồ sơ cầu thủ vừa cập nhật ngày sinh \(10\/01\/2004\)/),
    ).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Đối chiếu nội dung đính chính' });
    expect(within(table).getByText('10/01/2006')).toBeInTheDocument();
    expect(within(table).getByText('10/01/2004')).toBeInTheDocument();
    expect(within(table).getByText('Cầu thủ trẻ U21')).toBeInTheDocument();
    expect(within(table).getByText('Ngoài đào tạo nội địa')).toBeInTheDocument();

    expect(
      screen.getByText('Kết quả kiểm tra theo giai đoạn quy định (2 giai đoạn)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đạt')).toBeInTheDocument();
    expect(screen.getByText('Chưa đạt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Phê duyệt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trả lại bổ sung' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument();

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\b(D057|D100|FR-020|BM1|UC14|UC19)\b/);
  });

  it('submits independent manager approval with Idempotency-Key and targetVersionId', async () => {
    const onChanged = vi.fn();
    request.mockImplementation((_path: string, options?: { method?: string }) => {
      if (options?.method === 'POST') return Promise.resolve({ data: { state: 'APPROVED' } });
      return Promise.resolve({
        data: {
          caseId: 'club-case-1',
          seasonId: 'season-1',
          seasonState: 'OPEN',
          currentAcceptedVersionId: 'app-ver-1',
          items: [
            {
              id: 'app-ver-2',
              versionNumber: 2,
              versionKind: 'CORRECTION',
              predecessorVersionId: 'app-ver-1',
              baseAcceptedVersionId: 'app-ver-1',
              revision: '2',
              state: 'PENDING_APPROVAL',
              preparedBy: 'officer-1',
              preparer: { id: 'officer-1', fullName: 'Trần Cán Bộ', personnelCode: 'RO01' },
              editorIds: ['officer-1'],
              receivedAt: '2026-08-05T00:00:00.000Z',
              submittedAt: '2026-09-15T00:00:00.000Z',
              decidedAt: null,
              decidedBy: null,
              decider: null,
              decisionReason: null,
              coachName: 'HLV Đính Chính',
              homeStadiumId: 'std-2',
              homeStadium: {
                id: 'std-2',
                code: 'OTF',
                name: 'Old Trafford',
                location: 'Manchester',
              },
              representativeName: 'Đại diện CLB',
              representativePhone: '0901234567',
              contactAddress: '100 Stadium Way',
              notes: null,
              correctionReason: 'Ghi sai tên HLV trưởng.',
              correctionEvidence: 'Công văn số 12.',
              affectedReferences: { venueReviewRequired: true, declared: [] },
            },
          ],
          capabilities: { canPrepare: false, canApprove: true },
        },
      });
    });

    render(
      <OfficialCorrectionsPanel
        mode="club-application"
        caseId="club-case-1"
        clubName="Manchester United"
        seasonName="2026–2027"
        baseline={{
          versionId: 'app-ver-1',
          versionNumber: 1,
          receivedAt: '2026-08-05T00:00:00.000Z',
          coachName: 'HLV Ban Đầu',
          homeStadiumId: 'std-1',
          homeStadiumName: 'Sân Cũ',
          representativeName: 'Đại diện CLB',
          representativePhone: '0901234567',
          contactAddress: '100 Stadium Way',
          notes: null,
        }}
        stadiums={[
          { id: 'std-1', code: 'STD1', name: 'Sân Cũ', discontinuedAt: null },
          { id: 'std-2', code: 'OTF', name: 'Old Trafford', discontinuedAt: null },
        ]}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Phê duyệt' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Ý kiến quyết định *'), {
      target: { value: 'Chấp thuận đính chính hồ sơ tham dự.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Phê duyệt' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    const postCall = request.mock.calls.find(
      ([, opts]) => (opts as { method?: string } | undefined)?.method === 'POST',
    );
    expect(postCall?.[0]).toBe('/club-applications/club-case-1/corrections/app-ver-2/approve');
    expect(postCall?.[1]).toMatchObject({
      method: 'POST',
      body: {
        expectedRevision: '2',
        baseAcceptedVersionId: 'app-ver-1',
        reason: 'Chấp thuận đính chính hồ sơ tham dự.',
      },
    });
    expect(typeof postCall?.[1]?.requestKey).toBe('string');
  });
});
