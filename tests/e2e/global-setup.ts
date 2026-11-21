import { isAbsolute, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { resetPhase1Fixtures } from '../../backend/tests/fixtures/phase-1-fixtures';

function normalizedTargetKey(url: string): string {
  const parsed = new URL(url);
  const host = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname.toLowerCase())
    ? 'loopback'
    : parsed.hostname.toLowerCase();
  return `${host}:${parsed.port}:${decodeURIComponent(parsed.pathname)}`;
}

export default async function setup() {
  const target = assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? '');
  if (!/^\/whistle_test_browser(?:_[a-z0-9_]+)?$/.test(new URL(target).pathname))
    throw new Error(
      'Use a dedicated whistle_test_browser database, never a shared integration target.',
    );
  const browserKey = normalizedTargetKey(target);
  for (const [label, other] of [
    ['TEST_DATABASE_URL', process.env.TEST_DATABASE_URL],
    ['RESTORE_TEST_DATABASE_URL', process.env.RESTORE_TEST_DATABASE_URL],
  ] as const) {
    if (other && normalizedTargetKey(assertIsolatedTarget(other)) === browserKey)
      throw new Error(`E2E_TEST_DATABASE_URL must be separate from ${label}.`);
  }
  const mediaRoot = process.env.E2E_MEDIA_ROOT;
  if (mediaRoot) {
    const resolved = resolve(mediaRoot).toLowerCase();
    const tmp = resolve(tmpdir()).toLowerCase();
    const verification = resolve(process.cwd(), '.verification').toLowerCase();
    const within = (parent: string, child: string) => {
      const rel = relative(parent, child);
      return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
    };
    if (!within(tmp, resolved) && !within(verification, resolved))
      throw new Error('E2E_MEDIA_ROOT must be an isolated temporary or .verification directory.');
  }
  await resetPhase1Fixtures(target, process.env.E2E_RESET_ACK ?? '');
}
