import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../src/app/App';
import type {
  RegulationContent,
  RegulationVersionDetail,
  RegulationVersionHistoryItem,
  RegulationVersionSummary,
  RegulationVersionsData,
} from '../src/features/regulations/regulation-model';

const seasonId = '00000000-0000-4000-8000-000000000021';
const versionId = '00000000-0000-4000-8000-000000000091';
const account = {
  id: '00000000-0000-4000-8000-000000000001',
  personnelCode: 'STAFF-02',
  fullName: 'Quản lý mùa giải',
  username: 'season.manager',
  changeRequired: false,
  seasonRoles: [{ seasonId, roleCode: 'SEASON_MANAGER' }],
};
const season = {
  id: seasonId,
  code: 'MG-2028-2029',
  name: 'Mùa giải 2028/2029',
  competitionName: 'Giải Ngoại hạng',
  startDate: '2028-08-15',
  endDate: '2029-05-23',
  state: 'OPEN',
  revision: '1',
  effectiveRegulation: null,
  waitingRegulation: null,
  capabilities: { canEditMetadata: true },
};
const blankContent: RegulationContent = {
  effectiveMode: null,
  proposedEffectiveAt: null,
  squadLimit: null,
  nonHomegrownLimit: null,
  homegrownSeasons: null,
  homegrownMonths: null,
  homegrownAgeStart: null,
  homegrownAgeEnd: null,
  u21Cutoff: null,
  clubCount: null,
  formatCode: null,
  legs: null,
  plannedMinutes: null,
  preparationMinutes: null,
  releaseMinutes: null,
  winPoints: null,
  drawPoints: null,
  lossPoints: null,
  qualificationCount: null,
  relegationCount: null,
  registrationWindows: [],
  rankingPriority: [],
  goalTypes: [],
  cardTypes: [],
};
const envelope = (data: unknown, meta?: unknown) =>
  Response.json({ data, ...(meta ? { meta } : {}), requestId: 'phase-2-regulations-test' });
const wait = { timeout: 7_000 };

afterEach(() => vi.unstubAllGlobals());

function pathOf(input: RequestInfo | URL) {
  return new URL(String(input), 'https://whistle.test').pathname;
}

function summary(
  overrides: Omit<Partial<RegulationVersionSummary>, 'capabilities'> & {
    capabilities?: Partial<RegulationVersionSummary['capabilities']>;
  } = {},
): RegulationVersionSummary {
  const { capabilities, ...otherOverrides } = overrides;
  return {
    id: versionId,
    versionNumber: 1,
    revision: '1',
    state: 'DRAFT',
    predecessorVersionId: null,
    effectiveMode: null,
    proposedEffectiveAt: null,
    approvedAt: null,
    activationProcessedAt: null,
    activeFrom: null,
    activeUntil: null,
    isCurrentEffective: false,
    isCurrentDraft: true,
    preparedBy: { id: account.id, fullName: account.fullName },
    capabilities: {
      canEditDraft: true,
      canSubmit: false,
      canWithdraw: false,
      canReturn: false,
      canReject: false,
      canCreateSuccessor: false,
      ...capabilities,
    },
    ...otherOverrides,
  };
}

function detail(
  content = blankContent,
  revision = '1',
  overrides: Omit<Partial<RegulationVersionDetail>, 'capabilities'> & {
    capabilities?: Partial<RegulationVersionDetail['capabilities']>;
  } = {},
): RegulationVersionDetail {
  const { capabilities, ...otherOverrides } = overrides;
  return {
    id: versionId,
    seasonId,
    versionNumber: 1,
    revision,
    state: 'DRAFT',
    predecessorVersionId: null,
    submittedAt: null,
    decidedAt: null,
    decidedBy: null,
    decisionReason: null,
    effectiveMode: content.effectiveMode,
    proposedEffectiveAt: content.proposedEffectiveAt,
    approvedAt: null,
    activationProcessedAt: null,
    activeFrom: null,
    activeUntil: null,
    preparedBy: { id: account.id, fullName: account.fullName },
    editors: [],
    content,
    capabilities: {
      canEditDraft: true,
      canSubmit: false,
      canWithdraw: false,
      canReturn: false,
      canReject: false,
      canCreateSuccessor: false,
      ...capabilities,
    },
    ...otherOverrides,
  };
}

function listData(
  items: RegulationVersionSummary[],
  canCreateDraft: boolean,
  options: {
    page?: number;
    pageSize?: number;
    total?: number;
    overview?: RegulationVersionsData['overview'];
  } = {},
) {
  const { page = 1, pageSize = 20, total = items.length, overview } = options;
  return envelope(
    {
      items,
      capabilities: { canCreateDraft },
      overview: overview ?? { currentEffective: null, waiting: null },
    },
    { page, pageSize, total },
  );
}

function historyItem(
  overrides: Partial<RegulationVersionHistoryItem> = {},
): RegulationVersionHistoryItem {
  return {
    id: '00000000-0000-4000-8000-000000000071',
    actorId: account.id,
    actorKind: 'ACCOUNT',
    operatorIdentity: null,
    occurredAt: '2028-07-01T00:00:00.000Z',
    actionCode: 'REGULATION_DRAFT_CREATED',
    objectKind: 'RegulationVersion',
    objectId: versionId,
    seasonId,
    outcome: 'SUCCESS',
    actorName: account.fullName,
    seasonCode: season.code,
    reason: null,
    before: null,
    after: null,
    ...overrides,
  };
}

function open(fetcher: typeof fetch) {
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter initialEntries={[`/workspace/seasons/${seasonId}/regulations`]}>
      <App />
    </MemoryRouter>,
  );
}

function definitionValue(root: HTMLElement, label: string): string | null | undefined {
  return within(root).getByText(label).parentElement?.querySelector('dd')?.textContent;
}

test('an unknown approval outcome retries the exact reviewed intent and receipt key', async () => {
  const commands: { key: string | null; body: unknown }[] = [];
  const current = detail({ ...blankContent, effectiveMode: 'IMMEDIATE' }, '2', {
    state: 'SUBMITTED',
    capabilities: { canEditDraft: false, canApprove: true },
  });
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (path.endsWith('/history'))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData([summary({ state: 'SUBMITTED', isCurrentDraft: false })], false);
    if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(current);
    if (path === `/api/v1/regulation-versions/${versionId}/approve` && init?.method === 'POST') {
      commands.push({
        key: new Headers(init.headers).get('Idempotency-Key'),
        body: JSON.parse(String(init.body)),
      });
      if (commands.length === 1) throw new TypeError('Simulated lost response');
      return envelope({ id: versionId, revision: '3' });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);
  fireEvent.click(await screen.findByRole('button', { name: 'Phê duyệt phiên bản' }, wait));
  const dialog = await screen.findByRole('dialog', { name: 'Xác nhận phê duyệt phiên bản' });
  const reason = within(dialog).getByLabelText('Lý do');
  fireEvent.change(reason, { target: { value: 'Đã đối chiếu phiên bản.' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận phê duyệt phiên bản' }));
  await waitFor(() => expect(commands).toHaveLength(1), { timeout: 3000 });
  const retry = await within(dialog).findByRole(
    'button',
    { name: 'Kiểm tra kết quả phê duyệt' },
    wait,
  );
  expect(reason).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: /^Hủy$/ })).toBeDisabled();
  fireEvent.click(retry);
  await waitFor(() => expect(commands).toHaveLength(2), wait);
  expect(commands[0]).toMatchObject({
    key: expect.stringMatching(/^[0-9a-f-]{36}$/i),
    body: {
      expectedRevision: '2',
      submittedVersionId: versionId,
      expectedCurrentVersionId: null,
      reason: 'Đã đối chiếu phiên bản.',
    },
  });
  expect(commands[1]).toEqual(commands[0]);
}, 15_000);

test('at the known cutoff an unresolved basis stops labeling the cached version current', async () => {
  const cutoff = new Date(Date.now() + 1_500).toISOString();
  let reads = 0;
  const current = summary({ state: 'EFFECTIVE', isCurrentEffective: true, isCurrentDraft: false });
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/history'))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/regulation-versions/${versionId}`)
      return envelope(detail(blankContent, '1', { state: 'EFFECTIVE' }));
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`) {
      reads++;
      if (reads > 1)
        return Response.json({ error: { code: 'REGULATION_BASIS_UNRESOLVED' } }, { status: 503 });
      return listData([current], false, {
        overview: {
          currentEffective: current,
          waiting: {
            ...current,
            id: '00000000-0000-4000-8000-000000000092',
            versionNumber: 2,
            state: 'APPROVED_WAITING',
            proposedEffectiveAt: cutoff,
          },
        },
      });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);
  const effective = await screen.findByRole('region', { name: 'Quy định đang hiệu lực' }, wait);
  expect(await within(effective).findByText('Phiên bản 1', undefined, wait)).toBeVisible();
  expect(
    await within(effective).findByText('Chưa xác định được quy định hiệu lực', undefined, wait),
  ).toBeVisible();
  expect(within(effective).queryByText('Phiên bản 1')).not.toBeInTheDocument();
}, 15_000);

test('draft creation stays empty until confirmed source values are applied', async () => {
  let created = false;
  let savedPatch: Record<string, unknown> | undefined;
  let currentDetail = detail();
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions` && init?.method === 'POST') {
      created = true;
      return envelope({ id: versionId, revision: '1' });
    }
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData(created ? [summary()] : [], !created);
    if (path === `/api/v1/regulation-versions/${versionId}` && init?.method === 'PATCH') {
      savedPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
      currentDetail = detail({ ...currentDetail.content, ...savedPatch }, '2');
      return envelope({ id: versionId, revision: '2' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(currentDetail);
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByText(/MG-2028-2029/, undefined, wait)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bản nháp quy định' }));
  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  expect(screen.getByLabelText('Giới hạn danh sách cầu thủ')).toHaveValue(null);
  expect(screen.getByLabelText('Ngày sinh giới hạn U21')).toHaveValue('');
  expect(screen.getByLabelText('Số câu lạc bộ')).toHaveValue(null);
  expect(screen.getByLabelText('Điểm thắng')).toHaveValue(null);
  expect(screen.getByLabelText('Số vị trí giành quyền tham dự (Q)')).toHaveValue(null);
  expect(
    screen.queryByRole('button', { name: /gửi thẩm định|phê duyệt/i }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Xem và xác nhận giá trị đề xuất từ nguồn' }));
  const confirmation = await screen.findByRole(
    'dialog',
    { name: 'Xác nhận điền giá trị đề xuất' },
    wait,
  );
  expect(within(confirmation).getByText(/20 câu lạc bộ, 25 cầu thủ, 17 cầu thủ/i)).toBeVisible();
  expect(screen.getByLabelText('Giới hạn danh sách cầu thủ')).toHaveValue(null);
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Xác nhận điền' }));
  expect(screen.getByLabelText('Giới hạn danh sách cầu thủ')).toHaveValue(25);
  expect(screen.getByLabelText('Giới hạn cầu thủ không thuộc diện đào tạo trong nước')).toHaveValue(
    17,
  );
  expect(screen.getByLabelText('Số mùa đào tạo tối thiểu')).toHaveValue(3);
  expect(screen.getByLabelText('Số tháng đào tạo tối thiểu')).toHaveValue(36);
  expect(screen.getByLabelText('Số câu lạc bộ')).toHaveValue(20);
  expect(screen.getByLabelText('Số vị trí xuống hạng (R)')).toHaveValue(null);
  expect(screen.getByLabelText('Số vị trí giành quyền tham dự (Q)')).toHaveValue(null);
  expect(screen.getByLabelText('Ngày sinh giới hạn U21')).toHaveValue('');
  expect(screen.getByLabelText('Điểm thắng')).toHaveValue(null);

  fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(
    () =>
      expect(savedPatch).toEqual({
        expectedRevision: '1',
        squadLimit: 25,
        nonHomegrownLimit: 17,
        homegrownSeasons: 3,
        homegrownMonths: 36,
        clubCount: 20,
      }),
    wait,
  );
  expect(JSON.stringify(savedPatch)).not.toContain('id');
  expect(
    await screen.findByText(/Đã lưu bản nháp\. Nội dung chưa được gửi thẩm định/),
  ).toBeVisible();
}, 15_000);

test('typed draft fields use UTC instants, date-only values, and ID-free replacement arrays', async () => {
  let savedPatch: Record<string, unknown> | undefined;
  let currentDetail = detail({
    ...blankContent,
    registrationWindows: [
      {
        intakeKind: 'CLUB_APPLICATION',
        opensAt: '2028-08-01T00:00:05.678Z',
        closesAt: '2028-08-01T01:00:06.123Z',
      },
      {
        intakeKind: 'PLAYER_CHANGE',
        opensAt: '2028-08-02T00:00:00.001Z',
        closesAt: '2028-08-02T00:00:00.999Z',
      },
    ],
  });
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData([summary()], false);
    if (path === `/api/v1/regulation-versions/${versionId}` && init?.method === 'PATCH') {
      savedPatch = JSON.parse(String(init.body)) as Record<string, unknown>;
      const contentPatch = { ...savedPatch };
      delete contentPatch.expectedRevision;
      currentDetail = detail(
        { ...currentDetail.content, ...contentPatch } as RegulationContent,
        '2',
      );
      return envelope({ id: versionId, revision: '2' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(currentDetail);
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByLabelText('Cách đề xuất hiệu lực', undefined, wait)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Cách đề xuất hiệu lực'), {
    target: { value: 'SCHEDULED' },
  });
  fireEvent.change(screen.getByLabelText('Thời điểm hiệu lực dự kiến'), {
    target: { value: '2028-08-15T09:30' },
  });
  fireEvent.change(screen.getByLabelText('Ngày sinh giới hạn U21'), {
    target: { value: '2029-01-01' },
  });
  fireEvent.change(screen.getByLabelText('Số câu lạc bộ'), { target: { value: '20' } });
  fireEvent.change(screen.getByLabelText('Thể thức'), { target: { value: 'DOUBLE_ROUND_ROBIN' } });
  fireEvent.change(screen.getByLabelText('Số lượt'), { target: { value: '2' } });
  expect(screen.getByLabelText('Số vị trí xuống hạng (R)')).toHaveValue(null);
  fireEvent.click(screen.getByRole('button', { name: 'Xem và xác nhận giá trị đề xuất R = 3' }));
  const relegationConfirmation = await screen.findByRole(
    'dialog',
    { name: 'Xác nhận điền giá trị đề xuất' },
    wait,
  );
  expect(
    within(relegationConfirmation).getByText(/chỉ áp dụng khi số câu lạc bộ là 20/i),
  ).toBeVisible();
  fireEvent.click(within(relegationConfirmation).getByRole('button', { name: 'Xác nhận điền' }));
  expect(screen.getByLabelText('Số vị trí xuống hạng (R)')).toHaveValue(3);
  expect(screen.getByLabelText('Số vị trí giành quyền tham dự (Q)')).toHaveValue(null);

  expect(screen.getByLabelText('Mở từ đợt 1')).toHaveValue('2028-08-01T07:00:05.678');
  expect(screen.getByLabelText('Đóng trước đợt 1')).toHaveValue('2028-08-01T08:00:06.123');
  expect(screen.getByLabelText('Mở từ đợt 2')).toHaveValue('2028-08-02T07:00:00.001');
  expect(screen.getByLabelText('Đóng trước đợt 2')).toHaveValue('2028-08-02T07:00:00.999');
  fireEvent.change(screen.getByLabelText('Đóng trước đợt 1'), {
    target: { value: '2028-08-01T08:00:00.000' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Thêm đợt tiếp nhận' }));
  fireEvent.change(screen.getByLabelText('Mở từ đợt 3'), {
    target: { value: '2028-08-01T08:00' },
  });
  fireEvent.change(screen.getByLabelText('Đóng trước đợt 3'), {
    target: { value: '2028-08-01T09:00' },
  });
  expect(screen.queryByText(/Khoảng thời gian bị trùng/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Thêm tiêu chí xếp hạng' }));
  fireEvent.click(screen.getByRole('button', { name: 'Thêm loại bàn thắng' }));
  fireEvent.change(screen.getByLabelText('Mã loại bàn thắng 1'), { target: { value: ' a ' } });
  fireEvent.change(screen.getByLabelText('Tên loại bàn thắng 1'), {
    target: { value: ' Bàn   thắng thường ' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(() => expect(savedPatch).toBeDefined(), wait);
  expect(savedPatch).toMatchObject({
    expectedRevision: '1',
    effectiveMode: 'SCHEDULED',
    proposedEffectiveAt: '2028-08-15T02:30:00.000Z',
    u21Cutoff: '2029-01-01',
    clubCount: 20,
    formatCode: 'DOUBLE_ROUND_ROBIN',
    legs: 2,
    relegationCount: 3,
    registrationWindows: [
      {
        intakeKind: 'CLUB_APPLICATION',
        opensAt: '2028-08-01T00:00:05.678Z',
        closesAt: '2028-08-01T01:00:00.000Z',
      },
      {
        intakeKind: 'PLAYER_CHANGE',
        opensAt: '2028-08-02T00:00:00.001Z',
        closesAt: '2028-08-02T00:00:00.999Z',
      },
      {
        intakeKind: 'CLUB_APPLICATION',
        opensAt: '2028-08-01T01:00:00.000Z',
        closesAt: '2028-08-01T02:00:00.000Z',
      },
    ],
    rankingPriority: [{ position: 1, criterionCode: 'POINTS' }],
    goalTypes: [{ code: 'A', name: 'Bàn thắng thường', isOwnGoal: false, enabled: true }],
  });
  expect(JSON.stringify(savedPatch)).not.toContain('"id"');
  expect(
    screen.queryByRole('button', { name: /gửi thẩm định|phê duyệt/i }),
  ).not.toBeInTheDocument();
}, 15_000);

test('versions are paged by API metadata while overview uses persisted pointers', async () => {
  const olderVersionId = '00000000-0000-4000-8000-000000000092';
  const listRequests: { page: string | null; pageSize: string | null; sort: string | null }[] = [];
  const overview = {
    currentEffective: {
      id: '00000000-0000-4000-8000-000000000081',
      versionNumber: 18,
      state: 'EFFECTIVE' as const,
      effectiveMode: 'IMMEDIATE' as const,
      proposedEffectiveAt: null,
      approvedAt: '2028-07-01T00:00:00.000Z',
      activeFrom: '2028-07-01T00:00:00.000Z',
      activeUntil: null,
    },
    waiting: {
      id: '00000000-0000-4000-8000-000000000082',
      versionNumber: 19,
      state: 'APPROVED_WAITING' as const,
      effectiveMode: 'SCHEDULED' as const,
      proposedEffectiveAt: '2028-08-01T00:00:00.000Z',
      approvedAt: '2028-07-02T00:00:00.000Z',
      activeFrom: null,
      activeUntil: null,
    },
  };
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input), 'https://whistle.test');
    const path = url.pathname;
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`) {
      const page = url.searchParams.get('page');
      listRequests.push({
        page,
        pageSize: url.searchParams.get('pageSize'),
        sort: url.searchParams.get('sort'),
      });
      if (page === '2')
        return listData(
          [
            summary({
              id: olderVersionId,
              versionNumber: 1,
              state: 'SUPERSEDED',
              isCurrentDraft: false,
              capabilities: { canEditDraft: false },
            }),
          ],
          false,
          { page: 2, pageSize: 20, total: 21, overview },
        );
      return listData([summary({ versionNumber: 21, revision: '4' })], false, {
        page: 1,
        pageSize: 20,
        total: 21,
        overview,
      });
    }
    if (path === `/api/v1/regulation-versions/${olderVersionId}`)
      return envelope(
        detail(blankContent, '1', {
          id: olderVersionId,
          versionNumber: 1,
          state: 'SUPERSEDED',
          capabilities: { canEditDraft: false },
        }),
      );
    if (path === `/api/v1/regulation-versions/${versionId}`)
      return envelope(detail(blankContent, '4', { versionNumber: 21 }));
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByRole('heading', { name: 'Phiên bản 21' }, wait)).toBeVisible();
  expect(screen.getByRole('region', { name: 'Quy định đang hiệu lực' })).toHaveTextContent(
    'Phiên bản 18',
  );
  expect(screen.getByRole('region', { name: 'Quy định chờ hiệu lực' })).toHaveTextContent(
    'Phiên bản 19',
  );
  expect(listRequests).toContainEqual({ page: '1', pageSize: '20', sort: 'versionNumber:desc' });

  fireEvent.click(screen.getByRole('button', { name: 'Phiên bản cũ hơn' }));
  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  expect(screen.getByRole('region', { name: 'Quy định đang hiệu lực' })).toHaveTextContent(
    'Phiên bản 18',
  );
  expect(screen.getByRole('region', { name: 'Quy định chờ hiệu lực' })).toHaveTextContent(
    'Phiên bản 19',
  );
  expect(listRequests).toContainEqual({ page: '2', pageSize: '20', sort: 'versionNumber:desc' });
  expect(screen.getByText('Trang 2 / 2')).toBeVisible();
}, 15_000);

test('revision conflict keeps draft values and requires review before rebasing a save', async () => {
  let detailReads = 0;
  const patches: Record<string, unknown>[] = [];
  let latest = detail();
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData([summary({ revision: '2' })], false);
    if (path === `/api/v1/regulation-versions/${versionId}` && init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      patches.push(body);
      if (patches.length === 1) {
        latest = detail({ ...blankContent, clubCount: 18 }, '2');
        return Response.json(
          { error: { code: 'REVISION_CONFLICT' }, requestId: 'stale-regulation' },
          { status: 409 },
        );
      }
      return envelope({ id: versionId, revision: '3' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}`) {
      detailReads++;
      return envelope(detailReads === 1 ? detail() : latest);
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByLabelText('Ngày sinh giới hạn U21', undefined, wait)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Ngày sinh giới hạn U21'), {
    target: { value: '2029-01-01' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  expect(await screen.findByRole('alert', undefined, wait)).toHaveTextContent(
    /đã được cập nhật ở nơi khác/i,
  );
  expect(screen.getByLabelText('Ngày sinh giới hạn U21')).toHaveValue('2029-01-01');
  expect(patches).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'Tải lại và so sánh' }));
  const review = await screen.findByRole('region', { name: 'So sánh nội dung đã nhập' }, wait);
  expect(review).toHaveTextContent('Đã nhập: 01/01/2029');
  expect(review).not.toHaveTextContent('Số câu lạc bộ');
  expect(screen.queryByRole('button', { name: 'Lưu bản nháp' })).not.toBeInTheDocument();

  fireEvent.click(within(review).getByRole('button', { name: 'Tiếp tục với thay đổi đã xem xét' }));
  expect(screen.getByLabelText('Số câu lạc bộ')).toHaveValue(18);
  expect(screen.getByLabelText('Ngày sinh giới hạn U21')).toHaveValue('2029-01-01');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(
    () =>
      expect(patches[1]).toEqual({
        expectedRevision: '2',
        u21Cutoff: '2029-01-01',
      }),
    wait,
  );
  expect(patches).toHaveLength(2);
}, 15_000);

test('action confirmation stays on its reviewed version across refresh and cancels on selection change', async () => {
  const secondVersionId = '00000000-0000-4000-8000-000000000094';
  let refreshList = false;
  let listReads = 0;
  const writes: { path: string; body: Record<string, unknown> }[] = [];
  const firstVersion = detail(
    { ...blankContent, squadLimit: 25, clubCount: 20, formatCode: 'DOUBLE_ROUND_ROBIN', legs: 2 },
    '1',
    { capabilities: { canSubmit: true } },
  );
  const secondVersion = detail({ ...blankContent, squadLimit: 30 }, '7', {
    id: secondVersionId,
    versionNumber: 2,
    state: 'SUBMITTED',
    capabilities: {},
  });

  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`) {
      listReads++;
      return listData(
        [
          summary({
            revision: refreshList ? '2' : '1',
            capabilities: { canSubmit: true },
          }),
          summary({
            id: secondVersionId,
            versionNumber: 2,
            revision: '7',
            state: 'SUBMITTED',
            isCurrentDraft: false,
            capabilities: {},
          }),
        ],
        false,
      );
    }
    if (path === `/api/v1/regulation-versions/${versionId}/submit` && init?.method === 'POST') {
      writes.push({ path, body: JSON.parse(String(init.body)) as Record<string, unknown> });
      return envelope({ id: versionId, revision: '2' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(firstVersion);
    if (path === `/api/v1/regulation-versions/${secondVersionId}`) return envelope(secondVersion);
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi thẩm định' }));
  const firstDialog = await screen.findByRole('dialog', { name: 'Xác nhận gửi thẩm định' }, wait);
  expect(firstDialog).toHaveTextContent(`${versionId}`);
  fireEvent.click(screen.getByRole('button', { name: /Phiên bản 2/ }));
  expect(await screen.findByRole('heading', { name: 'Phiên bản 2' }, wait)).toBeVisible();
  expect(screen.queryByRole('dialog', { name: 'Xác nhận gửi thẩm định' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Phiên bản 1/ }));
  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi thẩm định' }));
  const pinnedDialog = await screen.findByRole('dialog', { name: 'Xác nhận gửi thẩm định' }, wait);
  expect(definitionValue(pinnedDialog, 'Lần sửa đã tải')).toBe('1');
  expect(
    definitionValue(pinnedDialog, 'Đội hình · không thuộc diện đào tạo · độ tuổi đào tạo'),
  ).toContain('25');

  refreshList = true;
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới danh sách phiên bản' }));
  await waitFor(() => expect(listReads).toBeGreaterThan(1), wait);
  const refreshedPinnedDialog = screen.getByRole('dialog', { name: 'Xác nhận gửi thẩm định' });
  expect(definitionValue(refreshedPinnedDialog, 'Lần sửa đã tải')).toBe('1');
  expect(
    definitionValue(refreshedPinnedDialog, 'Đội hình · không thuộc diện đào tạo · độ tuổi đào tạo'),
  ).toContain('25');

  fireEvent.change(within(pinnedDialog).getByLabelText('Lý do'), {
    target: { value: 'Xác nhận phiên bản đang xem.' },
  });
  fireEvent.click(within(pinnedDialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }));
  await waitFor(
    () =>
      expect(writes).toEqual([
        {
          path: `/api/v1/regulation-versions/${versionId}/submit`,
          body: { expectedRevision: '1', reason: 'Xác nhận phiên bản đang xem.' },
        },
      ]),
    wait,
  );
}, 15_000);

test('action revision conflict preserves reason and requires reviewing and reconfirming refreshed content', async () => {
  const writes: Record<string, unknown>[] = [];
  let detailReads = 0;
  const latest = detail(
    { ...blankContent, squadLimit: 24, clubCount: 18, formatCode: 'DOUBLE_ROUND_ROBIN', legs: 2 },
    '2',
    { capabilities: { canSubmit: true } },
  );
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData([summary({ capabilities: { canSubmit: true } })], false);
    if (path === `/api/v1/regulation-versions/${versionId}/submit` && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      writes.push(body);
      if (writes.length === 1)
        return Response.json(
          { error: { code: 'REVISION_CONFLICT' }, requestId: 'stale-action-review' },
          { status: 409 },
        );
      return envelope({ id: versionId, revision: '3' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}`) {
      detailReads++;
      return envelope(
        detailReads === 1
          ? detail({ ...blankContent, squadLimit: 25 }, '1', {
              capabilities: { canSubmit: true },
            })
          : latest,
      );
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi thẩm định' }));
  const dialog = await screen.findByRole('dialog', { name: 'Xác nhận gửi thẩm định' }, wait);
  fireEvent.change(within(dialog).getByLabelText('Lý do'), {
    target: { value: '  Lý do é\r\nchi tiết  ' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }));
  await waitFor(() => expect(writes).toHaveLength(1), wait);
  expect(writes[0]).toEqual({ expectedRevision: '1', reason: 'Lý do é\nchi tiết' });
  expect(within(dialog).getByLabelText('Lý do')).toHaveValue('Lý do é\nchi tiết');
  expect(within(dialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' })).toBeDisabled();

  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Tải lại phiên bản để xem thay đổi' }),
  );
  const conflict = await screen.findByRole('region', { name: 'Kiểm tra phiên bản mới' }, wait);
  expect(conflict).toHaveTextContent('Bản mới: lần sửa 2');
  expect(
    within(conflict).getByRole('region', { name: 'Nội dung mới nhất đã lưu' }),
  ).toHaveTextContent('24');
  expect(writes).toHaveLength(1);

  fireEvent.click(
    within(conflict).getByRole('button', { name: 'Dùng nội dung mới để xem lại xác nhận' }),
  );
  expect(definitionValue(dialog, 'Lần sửa đã tải')).toBe('2');
  expect(
    definitionValue(dialog, 'Đội hình · không thuộc diện đào tạo · độ tuổi đào tạo'),
  ).toContain('24');
  expect(within(dialog).getByLabelText('Lý do')).toHaveValue('Lý do é\nchi tiết');
  expect(within(dialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' })).toBeEnabled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }));
  await waitFor(
    () =>
      expect(writes).toEqual([
        { expectedRevision: '1', reason: 'Lý do é\nchi tiết' },
        { expectedRevision: '2', reason: 'Lý do é\nchi tiết' },
      ]),
    wait,
  );
}, 15_000);

test('incomplete submission shows localized field feedback without losing its reason', async () => {
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: [] }, { page: 1, pageSize: 20, total: 0 });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData([summary({ capabilities: { canSubmit: true } })], false);
    if (path === `/api/v1/regulation-versions/${versionId}/submit` && init?.method === 'POST')
      return Response.json(
        {
          error: {
            code: 'VALIDATION_FAILED',
            details: [
              {
                field: 'clubCount',
                code: 'isSupportedCount',
                message: 'Số câu lạc bộ phải là số chẵn từ 4 đến 20.',
              },
            ],
          },
          requestId: 'incomplete-action',
        },
        { status: 400 },
      );
    if (path === `/api/v1/regulation-versions/${versionId}`)
      return envelope(detail(blankContent, '1', { capabilities: { canSubmit: true } }));
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi thẩm định' }));
  const dialog = await screen.findByRole('dialog', { name: 'Xác nhận gửi thẩm định' }, wait);
  fireEvent.change(within(dialog).getByLabelText('Lý do'), {
    target: { value: 'Đề nghị kiểm tra nội dung.' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }));

  expect(await within(dialog).findByRole('alert', undefined, wait)).toHaveTextContent(
    'Vui lòng kiểm tra dữ liệu đã nhập.',
  );
  expect(within(dialog).getByRole('list', { name: 'Chi tiết lỗi nội dung' })).toHaveTextContent(
    'Số câu lạc bộ: Số câu lạc bộ phải là số chẵn từ 4 đến 20.',
  );
  expect(within(dialog).getByLabelText('Lý do')).toHaveValue('Đề nghị kiểm tra nội dung.');
}, 15_000);

test('submission and withdrawal lock the exact version and require an explicit successor', async () => {
  const successorId = '00000000-0000-4000-8000-000000000093';
  let current = detail({ ...blankContent, squadLimit: 25 }, '1', {
    editors: [{ accountId: account.id, firstEditedAt: '2028-06-30T00:00:00.000Z' }],
    capabilities: { canSubmit: true },
  });
  let successor: RegulationVersionDetail | undefined;
  const events = [historyItem()];
  const commands: { path: string; body: Record<string, unknown> }[] = [];
  let successorPatch: Record<string, unknown> | undefined;

  function versionSummary(value: RegulationVersionDetail) {
    return summary({
      id: value.id,
      versionNumber: value.versionNumber,
      revision: value.revision,
      state: value.state,
      isCurrentDraft: value.state === 'DRAFT' && value.capabilities.canEditDraft,
      capabilities: { canEditDraft: value.capabilities.canEditDraft },
    });
  }

  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
      return envelope({ items: events }, { page: 1, pageSize: 20, total: events.length });
    if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions` && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      commands.push({ path, body });
      expect(body).toEqual({ predecessorVersionId: versionId });
      successor = detail({ ...current.content }, '1', {
        id: successorId,
        versionNumber: 2,
        predecessorVersionId: current.id,
        capabilities: { canEditDraft: true, canSubmit: true },
      });
      return envelope({ id: successorId, revision: '1' });
    }
    if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
      return listData(
        successor
          ? [versionSummary(successor), versionSummary(current)]
          : [versionSummary(current)],
        false,
      );
    if (path === `/api/v1/regulation-versions/${versionId}/submit` && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      commands.push({ path, body });
      current = {
        ...current,
        revision: '2',
        state: 'SUBMITTED',
        submittedAt: '2028-07-01T00:00:00.000Z',
        capabilities: {
          ...current.capabilities,
          canEditDraft: false,
          canSubmit: false,
          canWithdraw: true,
        },
      };
      events.push(
        historyItem({
          id: '00000000-0000-4000-8000-000000000072',
          actionCode: 'REGULATION_SUBMITTED',
          occurredAt: '2028-07-01T00:00:00.000Z',
          reason: String(body.reason),
          before: { state: 'DRAFT', revision: '1' },
          after: { state: 'SUBMITTED', revision: '2' },
        }),
      );
      return envelope({ id: versionId, revision: '2', state: 'SUBMITTED' });
    }
    if (path === `/api/v1/regulation-versions/${versionId}/withdraw` && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      commands.push({ path, body });
      current = {
        ...current,
        revision: '3',
        state: 'WITHDRAWN',
        decidedAt: '2028-07-02T00:00:00.000Z',
        decidedBy: { id: account.id, fullName: account.fullName },
        decisionReason: String(body.reason),
        capabilities: {
          ...current.capabilities,
          canWithdraw: false,
          canCreateSuccessor: true,
        },
      };
      events.push(
        historyItem({
          id: '00000000-0000-4000-8000-000000000073',
          actionCode: 'REGULATION_WITHDRAWN',
          occurredAt: '2028-07-02T00:00:00.000Z',
          reason: String(body.reason),
          before: { state: 'SUBMITTED', revision: '2' },
          after: { state: 'WITHDRAWN', revision: '3' },
        }),
      );
      return envelope({ id: versionId, revision: '3', state: 'WITHDRAWN' });
    }
    if (path === `/api/v1/regulation-versions/${successorId}` && init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      successorPatch = body;
      const contentPatch = Object.fromEntries(
        Object.entries(body).filter(([key]) => key !== 'expectedRevision'),
      );
      successor = detail({ ...successor!.content, ...contentPatch } as RegulationContent, '2', {
        id: successorId,
        versionNumber: 2,
        predecessorVersionId: versionId,
        capabilities: { canEditDraft: true, canSubmit: true },
      });
      return envelope({ id: successorId, revision: '2' });
    }
    if (path === `/api/v1/regulation-versions/${successorId}`) return envelope(successor);
    if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(current);
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Gửi thẩm định' })).toBeVisible();
  expect(screen.queryByRole('button', { name: /phê duyệt|approve/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi thẩm định' }));
  const submissionDialog = await screen.findByRole('dialog', { name: 'Xác nhận gửi thẩm định' });
  expect(submissionDialog).toHaveTextContent('Phiên bản1');
  expect(submissionDialog).toHaveTextContent(versionId);
  expect(
    within(submissionDialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }),
  ).toBeDisabled();
  fireEvent.change(within(submissionDialog).getByLabelText('Lý do'), {
    target: { value: 'Đề nghị thẩm định phiên bản này.' },
  });
  fireEvent.click(within(submissionDialog).getByRole('button', { name: 'Xác nhận gửi thẩm định' }));
  await waitFor(
    () =>
      expect(commands).toContainEqual({
        path: `/api/v1/regulation-versions/${versionId}/submit`,
        body: { expectedRevision: '1', reason: 'Đề nghị thẩm định phiên bản này.' },
      }),
    wait,
  );
  expect(screen.queryByLabelText('Cách đề xuất hiệu lực')).not.toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Rút phiên bản' }, wait)).toBeVisible();
  expect(await screen.findByText('Gửi thẩm định')).toBeVisible();
  expect(await screen.findByText('Lý do: Đề nghị thẩm định phiên bản này.')).toBeVisible();
  const beforeSubmission = await screen.findByText('Trước', undefined, wait);
  expect(beforeSubmission.parentElement?.querySelector('dd')?.textContent).toContain(
    'Bản nháp · lần sửa 1',
  );
  const afterSubmission = screen.getByText('Sau');
  expect(afterSubmission.parentElement?.querySelector('dd')?.textContent).toContain(
    'Đã gửi thẩm định · lần sửa 2',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Rút phiên bản' }));
  const withdrawalDialog = await screen.findByRole('dialog', { name: 'Xác nhận rút phiên bản' });
  fireEvent.change(within(withdrawalDialog).getByLabelText('Lý do'), {
    target: { value: 'Rút để cập nhật đề xuất.' },
  });
  fireEvent.click(within(withdrawalDialog).getByRole('button', { name: 'Xác nhận rút phiên bản' }));
  await waitFor(
    () =>
      expect(commands).toContainEqual({
        path: `/api/v1/regulation-versions/${versionId}/withdraw`,
        body: { expectedRevision: '2', reason: 'Rút để cập nhật đề xuất.' },
      }),
    wait,
  );
  expect(
    await screen.findByRole('button', { name: 'Tạo phiên bản kế tiếp để chỉnh sửa' }, wait),
  ).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên bản kế tiếp để chỉnh sửa' }));
  expect(await screen.findByRole('heading', { name: 'Phiên bản 2' }, wait)).toBeVisible();
  expect(screen.getByLabelText('Giới hạn danh sách cầu thủ')).toHaveValue(25);
  expect(successor?.predecessorVersionId).toBe(versionId);
  fireEvent.change(screen.getByLabelText('Giới hạn danh sách cầu thủ'), {
    target: { value: '24' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(
    () => expect(successorPatch).toEqual({ expectedRevision: '1', squadLimit: 24 }),
    wait,
  );
  expect(current.content.squadLimit).toBe(25);
  expect(successor?.content.squadLimit).toBe(24);
}, 20_000);

test.each([
  { action: 'return' as const, label: 'Trả lại để bổ sung', nextState: 'RETURNED' as const },
  { action: 'reject' as const, label: 'Từ chối phiên bản', nextState: 'REJECTED' as const },
])(
  'independent manager confirms %s against its exact submitted version',
  async ({ action, label, nextState }) => {
    const reviewer = { ...account, id: '00000000-0000-4000-8000-000000000002' };
    let submitted = detail({ ...blankContent, squadLimit: 25 }, '9', {
      state: 'SUBMITTED',
      submittedAt: '2028-07-01T00:00:00.000Z',
      preparedBy: { id: '00000000-0000-4000-8000-000000000003', fullName: 'Người chuẩn bị' },
      capabilities: {
        canEditDraft: false,
        [action === 'return' ? 'canReturn' : 'canReject']: true,
      },
    });
    const mutations: { path: string; body: Record<string, unknown> }[] = [];
    let events = [historyItem({ actionCode: 'REGULATION_SUBMITTED' })];
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(reviewer);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (/\/api\/v1\/regulation-versions\/[^/]+\/history$/.test(path))
        return envelope({ items: events }, { page: 1, pageSize: 20, total: events.length });
      if (path === `/api/v1/seasons/${seasonId}`) return envelope(season);
      if (path === `/api/v1/seasons/${seasonId}/regulation-versions`)
        return listData(
          [
            summary({
              revision: submitted.revision,
              state: submitted.state,
              isCurrentDraft: false,
              capabilities: { canEditDraft: false },
            }),
          ],
          false,
        );
      if (
        path === `/api/v1/regulation-versions/${versionId}/${action}` &&
        init?.method === 'POST'
      ) {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        mutations.push({ path, body });
        submitted = {
          ...submitted,
          revision: '10',
          state: nextState,
          decidedAt: '2028-07-02T00:00:00.000Z',
          decidedBy: { id: reviewer.id, fullName: reviewer.fullName },
          decisionReason: String(body.reason),
          capabilities: {
            canEditDraft: false,
            canSubmit: false,
            canWithdraw: false,
            canReturn: false,
            canReject: false,
            canCreateSuccessor: action === 'return',
          },
        };
        events = [
          historyItem({
            id: '00000000-0000-4000-8000-000000000074',
            actionCode: action === 'return' ? 'REGULATION_RETURNED' : 'REGULATION_REJECTED',
            reason: String(body.reason),
          }),
        ];
        return envelope({ id: versionId, revision: '10', state: nextState });
      }
      if (path === `/api/v1/regulation-versions/${versionId}`) return envelope(submitted);
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);

    expect(await screen.findByRole('heading', { name: 'Phiên bản 1' }, wait)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: label }));
    const dialog = await screen.findByRole('dialog', { name: `Xác nhận ${label.toLowerCase()}` });
    expect(dialog).toHaveTextContent(versionId);
    const confirm = within(dialog).getByRole('button', {
      name: `Xác nhận ${label.toLowerCase()}`,
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Lý do'), {
      target: { value: 'Quyết định sau khi xem xét phiên bản đã gửi.' },
    });
    fireEvent.click(confirm);
    await waitFor(
      () =>
        expect(mutations).toEqual([
          {
            path: `/api/v1/regulation-versions/${versionId}/${action}`,
            body: {
              expectedRevision: '9',
              submittedVersionId: versionId,
              reason: 'Quyết định sau khi xem xét phiên bản đã gửi.',
            },
          },
        ]),
      wait,
    );
    expect(await screen.findByText('Quyết định sau khi xem xét phiên bản đã gửi.')).toBeVisible();
    expect(submitted.state).toBe(nextState);
  },
  15_000,
);
