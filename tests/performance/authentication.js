import http from 'k6/http';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';

const origin = __ENV.BM01_ORIGIN;
if (
  __ENV.BM01_ISOLATED !== 'ISOLATED_AUTH_FIXTURE' ||
  !/^https:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin ?? '') ||
  !__ENV.BM01_FIXTURE
) {
  throw new Error('Use an explicit isolated HTTPS BM-01 target and synthetic fixture file.');
}
const fixture = JSON.parse(open(__ENV.BM01_FIXTURE));
const mode = __ENV.BM01_MODE ?? 'baseline';
const users = 20;
const attemptsPerUser = 5;
const expectedAttempts = users * attemptsPerUser;
const negative = mode === 'negative';
if (
  !['baseline', 'negative'].includes(mode) ||
  typeof fixture.password !== 'string' ||
  !Array.isArray(fixture.usernames) ||
  fixture.usernames.length !== expectedAttempts + 1 ||
  new Set(fixture.usernames).size !== fixture.usernames.length ||
  !fixture.usernames.every((username) => /^bm01\.fixture\.\d{3}$/.test(username))
) {
  throw new Error('Provide 101 distinct synthetic BM-01 identities and a fixture credential.');
}

const attempts = new Counter('bm01_attempts');
const success = new Rate('bm01_success');
const withinThreeSeconds = new Rate('bm01_within_3_seconds');
const loginTime = new Trend('bm01_login_ms', true);
const expectedDenial = new Rate('bm01_expected_denial');

export const options = {
  scenarios: {
    authentication: {
      executor: 'per-vu-iterations',
      vus: negative ? 1 : users,
      iterations: negative ? 1 : attemptsPerUser,
      exec: negative ? 'verifyThrottling' : 'authenticate',
      maxDuration: '2m',
    },
  },
  thresholds: negative
    ? { bm01_expected_denial: ['rate==1'] }
    : {
        bm01_attempts: ['count==100'],
        bm01_success: ['rate==1'],
        bm01_within_3_seconds: ['rate>=0.95'],
      },
  summaryTrendStats: ['min', 'med', 'avg', 'p(95)', 'max'],
};

/** Creates a fresh prelogin context and submits the credentials over the same HTTPS origin. */
function login(username, password) {
  http.cookieJar().clear(origin);
  const prelogin = http.get(origin + '/api/v1/auth/csrf', { timeout: '10s' });
  const token = prelogin.status === 200 && prelogin.json('data.csrfToken');
  if (typeof token !== 'string') return null;
  return http.post(origin + '/api/v1/auth/login', JSON.stringify({ username, password }), {
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
    },
    timeout: '10s',
  });
}

/** Measures one fixture login and credits the latency threshold only for an accepted session. */
export function authenticate() {
  const username = fixture.usernames[exec.scenario.iterationInTest];
  const response = login(username, fixture.password);
  const accepted = response?.status === 200 && response.json('data.changeRequired') === false;
  attempts.add(1);
  success.add(accepted);
  withinThreeSeconds.add(accepted && response.timings.duration <= 3000);
  if (response) loginTime.add(response.timings.duration);
}

/** Checks the five generic failures and the subsequent throttle response with a separate fixture identity. */
export function verifyThrottling() {
  const username = fixture.usernames[expectedAttempts];
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = login(username, fixture.password + ' deliberately invalid');
    expectedDenial.add(response?.status === (attempt <= 5 ? 401 : 429));
  }
}
