import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import { App } from '../src/app/App';

test('visitors see the Vietnamese foundation shell without internal administration controls', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: 'Whistle-EPL' })).toBeVisible();
  expect(screen.getByText('Nền tảng quản trị giải đấu')).toBeVisible();
  expect(screen.queryByRole('button', { name: /tài khoản|phân quyền|nhật ký/i })).toBeNull();
});
