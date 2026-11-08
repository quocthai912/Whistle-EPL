import { expect, type Page } from '@playwright/test';

/** Opens the requested menu and scopes options to its accessible listbox during popup transitions. */
export async function openOptions(page: Page, label: string | RegExp, keyboard = false) {
  const control = page.getByRole('combobox', { name: label, exact: true });
  if (keyboard) await control.press('ArrowDown');
  else await control.locator('..').click();
  await expect(control).toHaveAttribute('aria-expanded', 'true');
  const list = page.locator(
    '[id=' + JSON.stringify(await control.getAttribute('aria-controls')) + ']',
  );
  await expect(list).toBeVisible();
  return list;
}

/** Selects a visible custom-dropdown option through the same interaction as a user. */
export async function selectOption(page: Page, label: string | RegExp, option: string) {
  const list = await openOptions(page, label);
  await list.getByRole('option', { name: option, exact: true }).click();
  await expect(list).toBeHidden();
}
