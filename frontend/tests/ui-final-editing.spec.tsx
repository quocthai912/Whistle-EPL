import { ConfigProvider } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SessionProvider } from '../src/shared/http/session-context';
import { useSession } from '../src/shared/http/use-session';
import { MasterForm } from '../src/features/masters/MasterForms';
import { RegulationChangeReview } from '../src/features/regulations/RegulationChangeReview';
const id = '00000000-0000-4000-8000-000000000001';
const seasonId = '00000000-0000-4000-8000-000000000002';
const envelope = (data: unknown) => Response.json({ data, requestId: 'ui-final-test' });
afterEach(() => vi.unstubAllGlobals());
function Ready({ children }: { children: React.ReactNode }) {
  return useSession().ready ? children : null;
}
function mount(children: React.ReactNode) {
  render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <SessionProvider>
        <Ready>{children}</Ready>
      </SessionProvider>
    </ConfigProvider>,
  );
}
for (const correcting of [false, true])
  test(
    'one edit form preserves ' + (correcting ? 'source correction evidence' : 'ordinary update'),
    async () => {
      let body: unknown;
      const saved = vi.fn();
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(async (input, init) => {
          const path = new URL(String(input), 'https://whistle.test').pathname;
          if (path.endsWith('/auth/session'))
            return envelope({ id, username: 'test', fullName: 'Kiểm thử', changeRequired: false });
          if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
          if (path === '/api/v1/seasons') return envelope({ items: [] });
          if (path === '/api/v1/clubs/' + id && init?.method === 'PATCH') {
            body = JSON.parse(String(init.body));
            return envelope({ id, revision: '8' });
          }
          throw Error('Unexpected ' + path);
        }),
      );
      mount(
        <MasterForm
          master="clubs"
          detail={{
            id,
            revision: '7',
            code: 'MUN',
            name: 'Manchester United',
            abbreviation: 'MUN',
          }}
          onClose={() => {}}
          onSaved={saved}
        />,
      );
      const d = within(
        await screen.findByRole('dialog', { name: 'Chỉnh sửa thông tin câu lạc bộ' }),
      );
      expect(d.getByLabelText('Mã CLB')).toBeDisabled();
      await waitFor(() =>
        expect(d.getByText('Mã hồ sơ không thể thay đổi sau khi tạo.')).toBeVisible(),
      );
      fireEvent.change(d.getByLabelText('Tên câu lạc bộ'), {
        target: { value: 'Manchester United FC' },
      });
      if (correcting) {
        fireEvent.mouseDown(d.getByRole('combobox', { name: 'Loại chỉnh sửa' }));
        fireEvent.click(
          await screen.findByRole('option', { name: 'Sửa thông tin gốc đã ghi sai' }),
        );
        fireEvent.change(d.getByLabelText('Lý do hiệu chỉnh'), {
          target: { value: 'Đối chiếu hồ sơ gốc' },
        });
        fireEvent.change(d.getByLabelText('Căn cứ hiệu chỉnh'), {
          target: { value: 'Biên bản xác minh' },
        });
        expect(d.getByRole('region', { name: 'Đối chiếu thông tin hiệu chỉnh' })).toBeVisible();
      } else expect(d.queryByLabelText('Lý do hiệu chỉnh')).not.toBeInTheDocument();
      fireEvent.click(d.getByRole('button', { name: 'Lưu hồ sơ' }));
      await waitFor(() => expect(saved).toHaveBeenCalledOnce());
      expect(body).toEqual({
        expectedRevision: '7',
        name: 'Manchester United FC',
        abbreviation: 'MUN',
        ...(correcting
          ? { correctionReason: 'Đối chiếu hồ sơ gốc', correctionBasis: 'Biên bản xác minh' }
          : {}),
      });
    },
    15000,
  );
for (const canLoad of [true, false])
  test(
    'off-page waiting version ' +
      (canLoad ? 'resolves actual number' : 'blocks confirmation when identity unavailable'),
    async () => {
      const commands: unknown[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(async (input, init) => {
          const path = new URL(String(input), 'https://whistle.test').pathname;
          if (path.endsWith('/auth/session'))
            return envelope({ id, username: 'test', fullName: 'Kiểm thử', changeRequired: false });
          if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
          if (path === `/api/v1/seasons/${seasonId}/regulation-change-requests`) {
            if (init?.method === 'POST') {
              commands.push(JSON.parse(String(init.body)));
              return envelope({ id });
            }
            return envelope({ items: [] });
          }
          if (path === `/api/v1/regulation-versions/${id}`)
            return canLoad
              ? envelope({ id, versionNumber: 37 })
              : Response.json(
                  { error: { code: 'UNAVAILABLE', message: 'Không thể tải' } },
                  { status: 503 },
                );
          throw Error('Unexpected ' + path);
        }),
      );
      mount(
        <RegulationChangeReview
          seasonId={seasonId}
          waitingId={id}
          canManage
          versions={[]}
          onChanged={() => {}}
        />,
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Đề nghị hủy' }));
      const d = within(await screen.findByRole('dialog'));
      fireEvent.change(d.getByLabelText('Lý do'), {
        target: { value: 'Lịch hiệu lực cần điều chỉnh' },
      });
      if (canLoad) {
        await waitFor(() => expect(d.getByText('Phiên bản 37')).toBeVisible());
        fireEvent.click(d.getByRole('button', { name: 'Xác nhận' }));
        await waitFor(() =>
          expect(commands).toEqual([
            { action: 'CANCEL', waitingVersionId: id, reason: 'Lịch hiệu lực cần điều chỉnh' },
          ]),
        );
      } else {
        await d.findByRole('alert');
        expect(d.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
        expect(commands).toEqual([]);
      }
    },
    15000,
  );

test('catalog review removes redundant standard wording and retains custom meanings', async () => {
  const { RegulationReadView } = await import('../src/features/regulations/RegulationReview');
  const { blankRegulationContent } = await import('../src/features/regulations/regulation-model');
  const content = blankRegulationContent();
  content.goalTypes = [
    { code: 'NORMAL', name: 'Bàn thắng thông thường', isOwnGoal: false, enabled: true },
    { code: 'OWN_GOAL', name: 'Phản lưới nhà', isOwnGoal: true, enabled: true },
    { code: 'CUSTOM', name: 'Bàn loại A', isOwnGoal: true, enabled: true },
  ];
  content.cardTypes = [
    { code: 'YELLOW', name: 'Thẻ vàng', meaning: 'YELLOW', enabled: true },
    { code: 'CUSTOM', name: 'Thẻ loại B', meaning: 'RED', enabled: true },
  ];
  render(<RegulationReadView content={content} />);
  expect(screen.getByText('NORMAL').closest('li')).toHaveTextContent(
    'NORMAL · Bàn thắng thông thường',
  );
  expect(screen.getByText('NORMAL').closest('li')).not.toHaveTextContent('Không phản');
  expect(
    screen
      .getByText('OWN_GOAL')
      .closest('li')
      ?.textContent?.match(/Phản lưới nhà/g),
  ).toHaveLength(1);
  expect(screen.getAllByText('CUSTOM')[0].closest('li')).toHaveTextContent(
    'Bàn loại A · Phản lưới nhà',
  );
  expect(screen.getAllByText('CUSTOM')[1].closest('li')).toHaveTextContent('Thẻ loại B · Thẻ đỏ');
});
