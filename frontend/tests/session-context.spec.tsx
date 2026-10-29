import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useState } from 'react';
import { SessionProvider } from '../src/shared/http/session-context';
import { useSession } from '../src/shared/http/use-session';

afterEach(() => vi.unstubAllGlobals());
const session = {
  account: { id: 'first', personnelCode: 'FIRST', fullName: 'First', username: 'first' },
  changeRequired: false,
};
function View() {
  const { store, session: current } = useSession();
  const [draft, setDraft] = useState('');
  return (
    <>
      <span>{current?.account.id ?? 'anonymous'}</span>
      <input aria-label="Draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <button
        onClick={() =>
          store.acceptSession({ ...session, account: { ...session.account, id: 'second' } })
        }
      >
        Switch
      </button>
    </>
  );
}
test('changing accounts clears component drafts as well as shared memory', async () => {
  render(
    <SessionProvider>
      <View />
    </SessionProvider>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first-account-draft' } });
  expect(screen.getByRole('textbox')).toHaveValue('first-account-draft');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));
  });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByText('second')).toBeVisible();
});
