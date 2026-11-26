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
            reason: 'Công văn số R12/2026 về đính chính năm sinh.',
            basis: 'Giấy khai sinh bản chính số D105.',
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
              playingStart: '2026-08-10T00:00:00.125Z',
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
                      reason: 'Vượt giới hạn tổng số cầu thủ tính hạn mức theo D057 (24).',
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
    // A fractional difference is visible on both sides of the comparison.
    expect(within(table).getByText('Khoảng hiệu lực')).toBeInTheDocument();
    expect(within(table).getByText(/07:00:00,000/)).toBeInTheDocument();
    expect(within(table).getByText(/07:00:00,125/)).toBeInTheDocument();

    // User-recorded reason and basis render verbatim without stripping document codes
    expect(screen.getByText('Công văn số R12/2026 về đính chính năm sinh.')).toBeInTheDocument();
    expect(screen.getByText('Giấy khai sinh bản chính số D105.')).toBeInTheDocument();

    expect(
      screen.getByText('Kết quả kiểm tra theo giai đoạn quy định (2 giai đoạn)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đạt')).toBeInTheDocument();
    expect(screen.getByText('Chưa đạt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Phê duyệt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trả lại bổ sung' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument();

    // System-generated segment message and UI labels still strip internal spec codes
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

  it('uses baseAcceptedVersionId for approved club corrections and labels superseded approved entries as history', async () => {
    request.mockResolvedValue({
      data: {
        caseId: 'club-case-1',
        seasonId: 'season-1',
        seasonState: 'OPEN',
        currentAcceptedVersionId: 'app-ver-3',
        items: [
          {
            id: 'app-ver-2',
            versionNumber: 2,
            versionKind: 'CORRECTION',
            predecessorVersionId: 'app-ver-1',
            baseAcceptedVersionId: 'app-ver-1',
            revision: '2',
            state: 'APPROVED',
            preparedBy: 'officer-1',
            preparer: { id: 'officer-1', fullName: 'Trần Cán Bộ', personnelCode: 'RO01' },
            editorIds: ['officer-1'],
            receivedAt: '2026-08-05T00:00:00.000Z',
            submittedAt: '2026-09-10T00:00:00.000Z',
            decidedAt: '2026-09-11T00:00:00.000Z',
            decidedBy: 'manager-1',
            decider: { id: 'manager-1', fullName: 'Nguyễn Quản Lý', personnelCode: 'SM01' },
            decisionReason: 'Đã duyệt lần 1.',
            coachName: 'HLV Sau Đính Chính 1',
            homeStadiumId: 'std-1',
            homeStadium: { id: 'std-1', code: 'STD1', name: 'Sân Cũ', location: 'Manchester' },
            representativeName: 'Đại diện CLB',
            representativePhone: '0901234567',
            contactAddress: '100 Stadium Way',
            notes: null,
            correctionReason: 'Đính chính HLV theo CV-01.',
            correctionEvidence: 'Biên bản R1/2026.',
            affectedReferences: { venueReviewRequired: false, declared: [] },
          },
        ],
        capabilities: { canPrepare: false, canApprove: true },
      },
    });

    render(
      <OfficialCorrectionsPanel
        mode="club-application"
        caseId="club-case-1"
        clubName="Manchester United"
        seasonName="2026–2027"
        baseline={{
          versionId: 'app-ver-3',
          versionNumber: 3,
          receivedAt: '2026-08-05T00:00:00.000Z',
          coachName: 'HLV Sau Đính Chính 2',
          homeStadiumId: 'std-1',
          homeStadiumName: 'Sân Cũ',
          representativeName: 'Đại diện CLB',
          representativePhone: '0901234567',
          contactAddress: '100 Stadium Way',
          notes: null,
        }}
        versions={[
          {
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
          },
          {
            versionId: 'app-ver-3',
            versionNumber: 3,
            receivedAt: '2026-08-05T00:00:00.000Z',
            coachName: 'HLV Sau Đính Chính 2',
            homeStadiumId: 'std-1',
            homeStadiumName: 'Sân Cũ',
            representativeName: 'Đại diện CLB',
            representativePhone: '0901234567',
            contactAddress: '100 Stadium Way',
            notes: null,
          },
        ]}
        stadiums={[{ id: 'std-1', code: 'STD1', name: 'Sân Cũ', discontinuedAt: null }]}
        onChanged={() => undefined}
      />,
    );

    const table = await screen.findByRole('table', { name: 'Đối chiếu thông tin hồ sơ tham dự' });
    expect(within(table).getByText('Trước đính chính (Phiên bản 1)')).toBeInTheDocument();
    expect(within(table).getByText('HLV Ban Đầu')).toBeInTheDocument();
    expect(within(table).getByText('HLV Sau Đính Chính 1')).toBeInTheDocument();
    expect(
      screen.getByText(/Phiên bản 2 là bản đính chính đã phê duyệt trong lịch sử/),
    ).toBeInTheDocument();
  });

  it.each(['matching', 'changed', 'cleared reference'] as const)(
    'recovers a saved registration draft after failed submission (%s)',
    async (scenario) => {
      const onChanged = vi.fn();
      let submitAttempts = 0;
      let revision = '1';
      const preservedReference = {
        kind: 'OFFICIAL_RESULT',
        referenceId: 'ref-uuid-2',
        note: 'Trận 2',
      };
      request.mockImplementation((path: string, options?: { method?: string }) => {
        if (path.endsWith('/corrections') && !options?.method) {
          return Promise.resolve({
            data: {
              caseId: 'reg-case-1',
              seasonId: 'season-1',
              seasonState: 'OPEN',
              currentValidatedVersionId: 'ver-1',
              pendingSourceCorrection: {
                required: false,
                snapshotBirthDate: '2001-01-10',
                currentPlayerBirthDate: '2001-01-10',
              },
              items: [
                {
                  id: 'corr-draft-1',
                  correctionCaseId: 'corr-case-1',
                  versionNumber: 1,
                  predecessorVersionId: null,
                  revision,
                  state: 'DRAFT',
                  preparedBy: 'officer-1',
                  preparer: { id: 'officer-1', fullName: 'Trần Cán Bộ', personnelCode: 'RO01' },
                  editorIds: ['officer-1'],
                  submittedAt: null,
                  decidedAt: null,
                  decidedBy: null,
                  decider: null,
                  decisionReason: null,
                  targetVersionId: 'ver-1',
                  proposedVersionId: 'ver-2',
                  reason: 'Đính chính bản nháp.',
                  basis: 'Biên bản gốc.',
                  disposition: 'RETAIN_VALID',
                  beforeSummary: {
                    versionId: 'ver-1',
                    versionNumber: 1,
                    shirtNumber: 10,
                    playingStart: '2026-08-10T00:00:00.000Z',
                    playingEnd: '2026-10-01T00:00:00.000Z',
                    nonHomegrownOptIn: true,
                  },
                  afterSummary: {
                    versionId: 'ver-2',
                    versionNumber: 2,
                    shirtNumber: revision === '1' ? 10 : revision === '2' ? 11 : 12,
                    playingStart: '2026-08-10T00:00:00.000Z',
                    playingEnd: null,
                    nonHomegrownOptIn: false,
                    evidenceBranch: 'SEASONS',
                    qualifyingValue: 3,
                    affiliatedAssociationBasis: true,
                    evidenceSummary: 'Đào tạo đủ 3 mùa.',
                    evidenceReference: 'HG-01',
                  },
                  affectedReferences: {
                    declared: [
                      ...(scenario === 'cleared reference' && revision !== '1'
                        ? []
                        : [{ kind: 'SCHEDULED_MATCH', referenceId: 'ref-uuid-1', note: 'Trận 1' }]),
                      preservedReference,
                    ],
                  },
                  segments: [],
                },
              ],
              capabilities: { canPrepare: true, canApprove: false },
            },
          });
        }
        if (options?.method === 'PATCH') {
          revision = revision === '1' ? '2' : '3';
          return Promise.resolve({
            data: { correctionVersionId: 'corr-draft-1', revision },
          });
        }
        if (path.endsWith('/submit') && options?.method === 'POST') {
          submitAttempts += 1;
          if (submitAttempts === 1) {
            return Promise.reject(new Error('Network timeout'));
          }
          return Promise.resolve({ data: { state: 'SUBMITTED', revision: '3' } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <OfficialCorrectionsPanel
          mode="player-registration"
          caseId="reg-case-1"
          playerName="Nguyễn Văn A"
          clubName="Arsenal"
          seasonName="2026–2027"
          baseline={{
            versionId: 'ver-1',
            versionNumber: 1,
            receivedAt: '2026-08-06T00:00:00.000Z',
            shirtNumber: 10,
            playingStart: '2026-08-10T00:00:00.000Z',
            playingEnd: '2026-10-01T00:00:00.000Z',
            u21Finding: false,
            homegrownFinding: false,
            nonHomegrownOptIn: true,
            evidenceBranch: null,
            qualifyingValue: null,
            evidenceSummary: null,
            evidenceReference: null,
            affiliatedAssociationBasis: null,
            playingDisposition: 'ACTIVE',
            notes: null,
          }}
          onChanged={onChanged}
        />,
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa nháp' }));
      const dialog = await screen.findByRole('dialog');

      // Structured homegrown evidence inputs are visible and populated because nonHomegrownOptIn is false
      expect(within(dialog).getByLabelText('Số mùa / tháng đạt chuẩn')).toHaveValue(3);
      expect(within(dialog).getByLabelText('Tóm tắt minh chứng đào tạo nội địa')).toHaveValue(
        'Đào tạo đủ 3 mùa.',
      );

      // Edit shirt number only (do NOT touch related match note) and click Trình phê duyệt
      fireEvent.change(within(dialog).getByLabelText('Số áo đăng ký *'), {
        target: { value: '11' },
      });
      const note = within(dialog).getByLabelText('Trận đấu liên quan cần rà soát riêng (tùy chọn)');
      if (scenario === 'cleared reference') fireEvent.change(note, { target: { value: '' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Trình phê duyệt' }));

      // First submit fails with unknown outcome -> alert shown, modal remains open with saved draft revision
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        /chưa xác định kết quả trình phê duyệt/,
      );

      const patchCall = request.mock.calls.find(
        ([, opts]) => (opts as { method?: string } | undefined)?.method === 'PATCH',
      );
      expect(patchCall).toBeDefined();
      const patchBody = (patchCall?.[1] as { body: Record<string, unknown> }).body;
      // Explicit null playingEnd preserved (NOT overwritten by baseline's 2026-10-01)
      expect(patchBody.playingEnd).toBeNull();
      // Unchanged affectedReferences omitted from PATCH
      if (scenario === 'cleared reference') {
        expect(patchBody.affectedReferences).toEqual([preservedReference]);
      } else {
        expect('affectedReferences' in patchBody).toBe(false);
      }
      // Structured homegrown evidence passed to backend evaluator
      expect(patchBody).toMatchObject({
        evidenceBranch: 'SEASONS',
        qualifyingValue: 3,
        affiliatedAssociationBasis: true,
        evidenceSummary: 'Đào tạo đủ 3 mùa.',
        evidenceReference: 'HG-01',
      });

      if (scenario === 'changed') revision = '3';
      if (scenario === 'cleared reference') {
        fireEvent.change(note, { target: { value: 'Trận mới' } });
      }
      fireEvent.click(within(dialog).getByRole('button', { name: 'Trình phê duyệt' }));

      const patches = () =>
        request.mock.calls.filter(
          ([, opts]) => (opts as { method?: string } | undefined)?.method === 'PATCH',
        );
      const submits = () => request.mock.calls.filter(([path]) => String(path).endsWith('/submit'));
      if (scenario === 'changed') {
        await waitFor(() =>
          expect(within(dialog).getByRole('alert')).toHaveTextContent(/đã thay đổi/),
        );
        expect(patches()).toHaveLength(1);
        expect(submits()).toHaveLength(1);
        expect(onChanged).not.toHaveBeenCalled();
        fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
        await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
        return;
      }

      await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
      expect(submits()).toHaveLength(2);
      if (scenario === 'cleared reference') {
        expect(patches()).toHaveLength(2);
        expect(patches()[1]?.[1]).toMatchObject({
          body: {
            expectedRevision: '2',
            affectedReferences: [
              { kind: 'OFFICIAL_RESULT', referenceId: null, note: 'Trận mới' },
              preservedReference,
            ],
          },
        });
      } else {
        expect(patches()).toHaveLength(1);
        expect(submits()[1]?.[1]).toMatchObject({ body: { expectedRevision: '2' } });
      }
    },
  );
});
