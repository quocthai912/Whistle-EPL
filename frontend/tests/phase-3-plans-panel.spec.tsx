import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PlanChangeModal,
  RegistrationPlansPanel,
  type RegistrationPlansResponse,
} from '../src/features/registrations/RegistrationPlansPanel';
import {
  resolvePreTransferEnd,
  type PlanTransferItem,
} from '../src/features/registrations/registration-plans-model';
import { HttpFailure } from '../src/shared/http/client';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../src/shared/http/use-session', () => {
  const client = { request };
  const session = {};
  return { useSession: () => ({ client, session }) };
});

const reasonPlaceholder = 'Nhập lý do điều chỉnh mốc hiệu lực hoặc số áo…';
type Current = NonNullable<RegistrationPlansResponse['currentValidatedVersion']>;

function makePlans(overrides: {
  revision: string;
  versionId: string;
  versionRevision: string;
  playingStart: string;
  shirtNumber: number;
}): RegistrationPlansResponse {
  return {
    caseId: 'case-1',
    revision: overrides.revision,
    serverNow: '2026-11-20T00:00:00.000Z',
    season: { id: 'season-1', code: 'EPL26', name: 'Mùa giải 2026', state: 'OPEN' },
    club: {
      id: 'club-1',
      code: 'ARS',
      name: 'Arsenal',
      abbreviation: 'ARS',
      discontinuedAt: null,
    },
    player: {
      id: 'player-1',
      code: 'PL01',
      fullName: 'Nguyễn Văn A',
      birthDate: '2004-01-01',
      nationalityCode: 'ENG',
      positionCode: 'CM',
    },
    playingEffectivityStatus: 'UPCOMING',
    currentValidatedVersion: {
      id: overrides.versionId,
      versionNumber: 1,
      revision: overrides.versionRevision,
      state: 'VALID',
      shirtNumber: overrides.shirtNumber,
      playingStart: overrides.playingStart,
      playingEnd: null,
      playingDisposition: 'ACTIVE',
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
      decisionReason: null,
      decidedAt: null,
      decider: null,
    },
    activeTransferPlan: null,
    transferHistory: [],
    dependencies: [],
    authorizedTargetSeasons: [],
    capabilities: {
      seasonOpen: true,
      canManageSource: true,
      canTerminate: false,
      canTransfer: false,
      canPlanChange: true,
      canPlanCancel: false,
    },
  };
}

const plansV1 = makePlans({
  revision: '1',
  versionId: '11111111-1111-4111-8111-111111111111',
  versionRevision: '1',
  playingStart: '2026-12-01T00:00:00.000Z',
  shirtNumber: 9,
});
const plansV2 = makePlans({
  revision: '2',
  versionId: '22222222-2222-4222-8222-222222222222',
  versionRevision: '1',
  playingStart: '2026-12-05T00:00:00.000Z',
  shirtNumber: 10,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function postCalls() {
  return request.mock.calls.filter(
    ([, options]) => (options as { method?: string } | undefined)?.method === 'POST',
  ) as [string, { method: string; requestKey: string; body: Record<string, unknown> }][];
}

beforeEach(() => {
  request.mockReset();
});

describe('RegistrationPlansPanel refresh gating', () => {
  it('disables plan actions while a retained refresh is pending', async () => {
    const refresh = deferred<{ data: RegistrationPlansResponse }>();
    let getCount = 0;
    request.mockImplementation((_path: string, options?: { method?: string }) => {
      if (options?.method === 'POST') return Promise.resolve({ data: { id: 'case-1' } });
      getCount += 1;
      return getCount === 1 ? Promise.resolve({ data: plansV1 }) : refresh.promise;
    });

    render(<RegistrationPlansPanel caseId="case-1" onChanged={() => undefined} />);

    const action = await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' });
    expect(action).toBeEnabled();
    fireEvent.click(action);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(reasonPlaceholder), {
      target: { value: 'Điều chỉnh để kiểm tra làm mới dữ liệu.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }));

    // The successful mutation starts a refresh while previous plans remain on screen.
    await screen.findByText('Đã cập nhật kế hoạch đăng ký tương lai thành công.');
    expect(screen.getByRole('button', { name: 'Điều chỉnh kế hoạch' })).toBeDisabled();

    refresh.resolve({ data: plansV2 });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Điều chỉnh kế hoạch' })).toBeEnabled(),
    );
  });

  it('renders restricted counterpart sides and dependencies without leaking their details', async () => {
    const restrictedPlan: PlanTransferItem = {
      id: 'op-1',
      operationKind: 'TRANSFER',
      effectiveAt: '2026-12-10T00:00:00.000Z',
      reason: 'Chuyển câu lạc bộ liên mùa.',
      supersedesOperationId: null,
      isSuperseded: false,
      createdAt: '2026-11-20T00:00:00.000Z',
      actor: { id: 'a', fullName: 'Cán bộ đăng ký', personnelCode: 'RO01' },
      direction: 'INCOMING',
      canManageBothSides: false,
      counterpartAccessRestricted: true,
      oldSide: {
        accessRestricted: true,
        caseId: null,
        season: null,
        club: null,
        beforeVersion: null,
        afterVersion: null,
      },
      newSide: {
        accessRestricted: false,
        caseId: 'case-1',
        season: { id: 'season-1', code: 'EPL26', name: 'Mùa giải 2026', state: 'OPEN' },
        club: {
          id: 'club-1',
          code: 'ARS',
          name: 'Arsenal',
          abbreviation: 'ARS',
          discontinuedAt: null,
        },
        version: {
          id: 'v-1',
          versionNumber: 1,
          shirtNumber: 9,
          playingStart: '2026-12-10T00:00:00.000Z',
          playingEnd: null,
          playingDisposition: 'ACTIVE',
        },
      },
    };
    request.mockResolvedValue({
      data: {
        ...plansV1,
        activeTransferPlan: restrictedPlan,
        transferHistory: [restrictedPlan],
        dependencies: [
          {
            caseId: null,
            season: null,
            club: null,
            shirtNumber: null,
            playingStart: null,
            playingEnd: null,
            playingEffectivityStatus: null,
            accessRestricted: true,
          },
        ],
      },
    });

    render(<RegistrationPlansPanel caseId="case-1" onChanged={() => undefined} />);

    expect(await screen.findByText('Câu lạc bộ thuộc mùa giải ngoài phạm vi quyền')).toBeVisible();
    expect(
      screen.getByText('Hồ sơ đăng ký thuộc mùa giải ngoài phạm vi quyền'),
    ).toBeInTheDocument();
    expect(screen.getByText('Giới hạn phạm vi')).toBeInTheDocument();
    expect(screen.getAllByText(/Mùa giải ngoài phạm vi quyền/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Bắt đầu từ \d/)).toBeNull();
  });
});

describe('PlanChangeModal idempotent retry', () => {
  it('reuses the exact first payload and key after refreshed plans arrive during an unknown outcome', async () => {
    request.mockRejectedValueOnce(new HttpFailure(503, 'TRANSACTION_UNAVAILABLE', 'r1', true));
    request.mockResolvedValueOnce({ data: { id: 'case-1' } });
    const onDone = vi.fn();

    const { rerender } = render(
      <PlanChangeModal
        plans={plansV1}
        current={plansV1.currentValidatedVersion as Current}
        isStandalone
        onClose={() => undefined}
        onReload={() => undefined}
        onDone={onDone}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(reasonPlaceholder), {
      target: { value: 'Điều chỉnh kế hoạch lần đầu.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }));
    const retry = await screen.findByRole('button', { name: 'Kiểm tra / gửi lại cùng yêu cầu' });

    // Refreshed plans with a newer revision arrive while the outcome is still unknown.
    rerender(
      <PlanChangeModal
        plans={plansV2}
        current={plansV2.currentValidatedVersion as Current}
        isStandalone
        onClose={() => undefined}
        onReload={() => undefined}
        onDone={onDone}
      />,
    );
    expect(retry).toBeEnabled();
    fireEvent.click(retry);
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));

    const [first, second] = postCalls();
    expect(second[0]).toBe(first[0]);
    expect(second[1].requestKey).toBe(first[1].requestKey);
    expect(second[1].body).toEqual(first[1].body);
    expect(first[1].body).toMatchObject({
      versionId: plansV1.currentValidatedVersion!.id,
      expectedRevision: '1',
      playingStart: '2026-12-01T00:00:00.000Z',
      shirtNumber: 9,
    });
  });

  it('blocks a fresh submit when the displayed revision is replaced while open', async () => {
    const { rerender } = render(
      <PlanChangeModal
        plans={plansV1}
        current={plansV1.currentValidatedVersion as Current}
        isStandalone
        onClose={() => undefined}
        onReload={() => undefined}
        onDone={() => undefined}
      />,
    );
    rerender(
      <PlanChangeModal
        plans={plansV2}
        current={plansV2.currentValidatedVersion as Current}
        isStandalone
        onClose={() => undefined}
        onReload={() => undefined}
        onDone={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' })).toBeDisabled();
    expect(screen.getByText(/Kế hoạch vừa được cập nhật sang phiên bản mới/)).toBeInTheDocument();
    expect(postCalls()).toHaveLength(0);
  });

  it('clears definitive conflict details on field edit and replaces stale details with validation error while preserving unknown-outcome notice', async () => {
    request
      .mockRejectedValueOnce(
        new HttpFailure(409, 'STATE_CONFLICT', 'r2', false, [
          { field: 'SHIRT_NUMBER', code: 'CONFLICT_DEPENDENCY', message: 'Trùng số áo 9.' },
        ]),
      )
      .mockRejectedValueOnce(new HttpFailure(503, 'TRANSACTION_UNAVAILABLE', 'r3', true));
    render(
      <PlanChangeModal
        plans={plansV1}
        current={plansV1.currentValidatedVersion as Current}
        isStandalone
        onClose={() => undefined}
        onReload={() => undefined}
        onDone={() => undefined}
      />,
    );
    const reason = screen.getByPlaceholderText(reasonPlaceholder);
    fireEvent.change(reason, { target: { value: 'Điều chỉnh gây trùng số áo.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }));
    const conflict = await screen.findByRole('alert');
    expect(conflict).toHaveTextContent('Số áo đăng ký');
    expect(
      within(conflict).getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }),
    ).toBeInTheDocument();

    // Clearing reason clears the prior definitive conflict alert immediately
    fireEvent.change(reason, { target: { value: '' } });
    expect(screen.queryByRole('alert')).toBeNull();

    // Submitting with empty reason shows only validation error without stale conflict details/reload button
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }));
    const validation = await screen.findByRole('alert');
    expect(validation).toHaveTextContent('Vui lòng nhập lý do điều chỉnh kế hoạch tương lai.');
    expect(validation).not.toHaveTextContent('Số áo đăng ký');
    expect(
      within(validation).queryByRole('button', { name: 'Tải lại dữ liệu mới nhất' }),
    ).toBeNull();
    expect(postCalls()).toHaveLength(1);

    // Submitting again to an unknown outcome preserves the unknown-outcome notice and locks inputs
    fireEvent.change(reason, { target: { value: 'Thử lại lần 2 gặp lỗi không rõ kết quả.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }));
    await screen.findByRole('button', { name: 'Kiểm tra / gửi lại cùng yêu cầu' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(reason).toBeDisabled();
  });
});

describe('resolvePreTransferEnd', () => {
  const base = (id: string, overrides: Partial<PlanTransferItem>): PlanTransferItem => ({
    id,
    operationKind: 'PLAN_CHANGE',
    effectiveAt: '2026-12-10T00:00:00.000Z',
    reason: 'x',
    supersedesOperationId: null,
    isSuperseded: false,
    createdAt: '2026-11-20T00:00:00.000Z',
    actor: { id: 'a', fullName: 'A', personnelCode: 'A' },
    direction: 'OUTGOING',
    canManageBothSides: true,
    counterpartAccessRestricted: false,
    oldSide: {
      caseId: 'c',
      season: null,
      club: null,
      beforeVersion: {
        id: `${id}-before`,
        versionNumber: 1,
        shirtNumber: 9,
        playingStart: '2026-08-01T00:00:00.000Z',
        playingEnd: id === 'root' ? '2027-05-31T00:00:00.000Z' : '2026-12-01T00:00:00.000Z',
        playingDisposition: 'ACTIVE',
      },
      afterVersion: null,
    },
    newSide: { caseId: 'n', season: null, club: null, version: null },
    ...overrides,
  });

  it('reports the root transfer end only after reaching the lineage root', () => {
    const root = base('root', { operationKind: 'TRANSFER' });
    const change = base('change', { supersedesOperationId: 'root' });
    expect(resolvePreTransferEnd(change, [change, root])).toEqual({
      known: true,
      endIso: '2027-05-31T00:00:00.000Z',
    });
  });

  it('returns unknown when a predecessor is missing', () => {
    const change = base('change', { supersedesOperationId: 'missing' });
    expect(resolvePreTransferEnd(change, [change])).toEqual({ known: false, endIso: null });
  });

  it('returns unknown on a cyclic lineage or when the hop limit is reached', () => {
    const a = base('a', { supersedesOperationId: 'b' });
    const b = base('b', { supersedesOperationId: 'a' });
    expect(resolvePreTransferEnd(a, [a, b])).toEqual({ known: false, endIso: null });

    const chain = Array.from({ length: 60 }, (_, i) =>
      base(`n${i}`, { supersedesOperationId: i === 59 ? null : `n${i + 1}` }),
    );
    chain[59] = { ...chain[59], operationKind: 'TRANSFER' };
    expect(resolvePreTransferEnd(chain[0], chain)).toEqual({ known: false, endIso: null });
  });
});
