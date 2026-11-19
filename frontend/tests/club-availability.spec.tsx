import { test } from 'vitest';
import { verifyAvailabilityConfirmation } from './master-availability-harness';

test('Club discontinuation requires a reason and preserves the exact revision', async () => {
  await verifyAvailabilityConfirmation('clubs', false);
});
