import { DatabaseService } from '../../src/platform/database.service';
import { LoginThrottleService } from '../../src/identity-access/login-throttle.service';
import { TestClock } from '../fixtures/test-clock';
import { resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';

describe('persistent rolling login throttling', () => {
  const clock = new TestClock(new Date('2026-10-29T03:00:00Z'));
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!, clock);
  beforeAll(async () =>
    resetPhase1Fixtures(process.env.TEST_DATABASE_URL!, 'RESET_ISOLATED_TEST_DATABASE'),
  );
  afterAll(async () => database.close());
  beforeEach(() => clock.set(new Date('2026-10-29T03:00:00Z')));
  it('serializes missing username keys, persists a block across adapters and never extends it on retry', async () => {
    const throttle = new LoginThrottleService();
    const attempt = (adapter: LoginThrottleService) =>
      database.write(
        adapter.locks('unknown.person', '192.0.2.1'),
        async () => {},
        (context) => adapter.attempt(context, 'unknown.person', '192.0.2.1', false),
      );
    const outcomes = await Promise.all(Array.from({ length: 6 }, () => attempt(throttle)));
    expect(outcomes.filter((outcome) => outcome === 'FAILED')).toHaveLength(5);
    expect(outcomes.filter((outcome) => outcome === 'THROTTLED')).toHaveLength(1);
    clock.set(new Date('2026-10-29T03:14:59.999Z'));
    expect(await attempt(new LoginThrottleService())).toBe('THROTTLED');
    clock.set(new Date('2026-10-29T03:15:00Z'));
    expect(await attempt(new LoginThrottleService())).toBe('FAILED');
  });
  it('resets the username sequence on success without erasing IP history, including same-instant attempts', async () => {
    const throttle = new LoginThrottleService();
    const attempt = (username: string, valid: boolean) =>
      database.write(
        throttle.locks(username, '192.0.2.2'),
        async () => {},
        (context) => throttle.attempt(context, username, '192.0.2.2', valid),
      );
    for (let i = 0; i < 4; i++) expect(await attempt('reset.user', false)).toBe('FAILED');
    expect(await attempt('reset.user', true)).toBe('SUCCEEDED');
    for (let i = 0; i < 4; i++) expect(await attempt('reset.user', false)).toBe('FAILED');
    expect(await attempt('reset.user', true)).toBe('SUCCEEDED');
    for (let i = 0; i < 12; i++) expect(await attempt(`ip.user.${i}`, false)).toBe('FAILED');
    expect(await attempt('valid.other', true)).toBe('THROTTLED');
  });
  it('enforces the source threshold under concurrency across independent connections and database adapters', async () => {
    const second = new DatabaseService(process.env.TEST_DATABASE_URL!, clock);
    const throttle = new LoginThrottleService();
    try {
      const outcomes = await Promise.all(
        Array.from({ length: 21 }, (_, i) =>
          (i % 2 ? database : second).write(
            throttle.locks(`source.user.${i}`, '192.0.2.3'),
            async () => {},
            (context) => throttle.attempt(context, `source.user.${i}`, '192.0.2.3', false),
          ),
        ),
      );
      expect(outcomes.filter((outcome) => outcome === 'FAILED')).toHaveLength(20);
      expect(outcomes.filter((outcome) => outcome === 'THROTTLED')).toHaveLength(1);
    } finally {
      await second.close();
    }
    const restarted = new DatabaseService(process.env.TEST_DATABASE_URL!, clock);
    try {
      expect(
        await restarted.write(
          throttle.locks('fresh.user', '192.0.2.3'),
          async () => {},
          (context) => throttle.attempt(context, 'fresh.user', '192.0.2.3', true),
        ),
      ).toBe('THROTTLED');
    } finally {
      await restarted.close();
    }
  });
  it('excludes failures at the exact rolling-window start', async () => {
    const throttle = new LoginThrottleService();
    const attempt = () =>
      database.write(
        throttle.locks('rolling.user', '192.0.2.4'),
        async () => {},
        (context) => throttle.attempt(context, 'rolling.user', '192.0.2.4', false),
      );
    for (let i = 0; i < 4; i++) expect(await attempt()).toBe('FAILED');
    clock.set(new Date('2026-10-29T03:15:00Z'));
    for (let i = 0; i < 4; i++) expect(await attempt()).toBe('FAILED');
  });
});
