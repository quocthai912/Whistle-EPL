import { resetPhase1Fixtures } from '../../backend/tests/fixtures/phase-1-fixtures';

export default async function setup() {
  const target = process.env.E2E_TEST_DATABASE_URL ?? '';
  if (!/^\/whistle_test_browser(?:_[a-z0-9_]+)?$/.test(new URL(target).pathname))
    throw new Error(
      'Use a dedicated whistle_test_browser database, never a shared integration target.',
    );
  await resetPhase1Fixtures(target, process.env.E2E_RESET_ACK ?? '');
}
