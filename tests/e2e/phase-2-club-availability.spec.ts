import { test } from '@playwright/test';
import { browserAvailabilityFlow } from './master-availability-flow';

test('Club D099 confirmation and history preserve the same profile after resumption', async ({
  page,
}) => {
  await browserAvailabilityFlow(page, 'club');
});
