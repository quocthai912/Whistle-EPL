import { test } from '@playwright/test';
import { browserAvailabilityFlow } from './master-availability-flow';

test('Stadium D099 confirmation and history preserve the same profile after resumption', async ({
  page,
}) => {
  await browserAvailabilityFlow(page, 'stadium');
});
