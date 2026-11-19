import { ConfigProvider } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SessionProvider } from '../src/shared/http/session-context';
import { useSession } from '../src/shared/http/use-session';
import { MasterForm } from '../src/features/masters/MasterForms';
const id = '00000000-0000-4000-8000-000000000001';
const envelope = (data: unknown) => Response.json({ data, requestId: 'create-logo-test' });
afterEach(() => vi.unstubAllGlobals());
function SignedInForm({ saved }: { saved: () => void }) {
  const { ready } = useSession();
  return ready ? <MasterForm master="clubs" onClose={() => {}} onSaved={saved} /> : null;
}
for (const uploadSucceeds of [true, false])
  test(
    'club create with logo: ' +
      (uploadSucceeds
        ? 'uploads against returned revision'
        : 'keeps confirmed creation and prevents duplicate POST after upload failure'),
    { timeout: 15000 },
    async () => {
      const saved = vi.fn();
      const bodies: unknown[] = [];
      let uploaded: FormData | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(async (input, init) => {
          const path = new URL(String(input), 'https://whistle.test').pathname;
          if (path.endsWith('/auth/session'))
            return envelope({ id, username: 'test', fullName: 'Kiểm thử', changeRequired: false });
          if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
          if (path === '/api/v1/clubs') {
            bodies.push(JSON.parse(String(init?.body)));
            return envelope({ id, revision: '7' });
          }
          if (path === `/api/v1/clubs/${id}/logo`) {
            uploaded = init?.body as FormData;
            return uploadSucceeds
              ? envelope({ id, revision: '8' })
              : Response.json(
                  {
                    error: { code: 'INVALID_MEDIA', message: 'Tệp ảnh không hợp lệ.' },
                    requestId: 'logo-failed',
                  },
                  { status: 422 },
                );
          }
          throw Error('Unexpected ' + path);
        }),
      );
      render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <SessionProvider>
            <SignedInForm saved={saved} />
          </SessionProvider>
        </ConfigProvider>,
      );
      const form = within(await screen.findByRole('dialog', { name: 'Thêm câu lạc bộ' }));
      fireEvent.change(form.getByLabelText('Mã CLB'), { target: { value: 'MUN' } });
      fireEvent.change(form.getByLabelText('Tên câu lạc bộ'), {
        target: { value: 'Manchester United' },
      });
      fireEvent.change(form.getByLabelText('Tên viết tắt'), { target: { value: 'MUN' } });
      const file = new File(['fixture'], 'crest.png', { type: 'image/png' });
      fireEvent.change(form.getByLabelText('Biểu trưng câu lạc bộ (không bắt buộc)'), {
        target: { files: [file] },
      });
      fireEvent.click(form.getByRole('button', { name: 'Lưu hồ sơ' }));
      await waitFor(() => expect(uploaded).toBeInstanceOf(FormData));
      expect(uploaded?.get('expectedRevision')).toBe('7');
      expect((uploaded?.get('file') as File).name).toBe('crest.png');
      expect(bodies).toEqual([{ code: 'MUN', name: 'Manchester United', abbreviation: 'MUN' }]);
      if (uploadSucceeds) {
        await waitFor(() => expect(saved).toHaveBeenCalledOnce());
      } else {
        expect(await form.findByRole('alert')).toBeVisible();
        expect(form.getByRole('status')).toHaveTextContent('Hồ sơ đã được tạo');
        expect(form.queryByRole('button', { name: 'Lưu hồ sơ' })).not.toBeInTheDocument();
        fireEvent.click(form.getByRole('button', { name: 'Xem danh sách hồ sơ' }));
        expect(saved).toHaveBeenCalledOnce();
        expect(bodies).toHaveLength(1);
      }
    },
  );
