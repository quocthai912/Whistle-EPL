import { test } from 'vitest';
import { verifyAvailabilityConfirmation } from './master-availability-harness';

test('Stadium resumption submits only through the explicit confirmation', async () => {
  await verifyAvailabilityConfirmation('stadiums', true);
});
