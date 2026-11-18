import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const origin = __ENV.PHASE2_ORIGIN;
if (
  __ENV.PHASE2_ISOLATED !== 'ISOLATED_CLUB_LOOKUP' ||
  !/^https:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin ?? '') ||
  !__ENV.PHASE2_FIXTURE
)
  throw new Error('Explicit isolated HTTPS origin and protected fixture required.');
const fixture = JSON.parse(open(__ENV.PHASE2_FIXTURE));
if (
  fixture.accounts?.length !== 20 ||
  fixture.total !== 25 ||
  !fixture.accounts.every(
    (account) =>
      /^lookup\.fixture\.\d{2}$/.test(account.username) && typeof account.password === 'string',
  ) ||
  !Array.isArray(fixture.expectedIds) ||
  fixture.expectedIds.length !== 25 ||
  !fixture.targetId ||
  !fixture.search
)
  throw new Error('Use the declared 20-user, 25-club isolated lookup fixture.');

const accepted = new Rate('club_lookup_success');
const samples = new Counter('club_lookup_samples');
const complete = new Rate('club_paging_complete');
const authenticationFailure = new Error('Synthetic lookup authentication failed.');
const latency = {
  list: new Trend('club_list_ms', true),
  search: new Trend('club_search_ms', true),
  detail: new Trend('club_detail_ms', true),
};
const within = {
  list: new Rate('club_list_within_2s'),
  search: new Rate('club_search_within_2s'),
  detail: new Rate('club_detail_within_2s'),
};
export const options = {
  hosts: { localhost: '127.0.0.1' },
  noCookiesReset: true,
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
      exec: 'warmup',
      gracefulStop: '10s',
    },
    measured: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      startTime: '1m10s',
      exec: 'measured',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    club_lookup_samples: ['count>0'],
    club_lookup_success: ['rate==1'],
    club_paging_complete: ['rate==1'],
    club_list_within_2s: ['rate>=0.95'],
    club_search_within_2s: ['rate>=0.95'],
    club_detail_within_2s: ['rate>=0.95'],
  },
};

export function setup() {
  const ready = http.get(origin + '/ready', { timeout: '10s' });
  if (ready.status !== 200) throw new Error('Isolated lookup backend is not ready.');
  login();
  const probe = http.get(origin + '/api/v1/clubs');
  if (probe.status !== 200 || probe.json('meta.total') !== 25)
    throw new Error('Authenticated lookup fixture is unavailable.');
}
function login() {
  if (http.cookieJar().cookiesForURL(origin)['__Host-whistle-session']?.length) return;
  const account = fixture.accounts[Math.max(0, exec.vu.idInTest - 1) % 20];
  const csrf = http.get(origin + '/api/v1/auth/csrf').json('data.csrfToken');
  const response = http.post(origin + '/api/v1/auth/login', JSON.stringify(account), {
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  });
  if (response.status !== 200 || response.json('data.changeRequired') !== false)
    throw authenticationFailure;
}

function payload(response) {
  if (response.status !== 200) return null;
  try {
    return response.json();
  } catch {
    return null;
  }
}

function pageData(response) {
  const body = payload(response);
  const items = body?.data?.items;
  return Array.isArray(items) && items.every((item) => item && typeof item.id === 'string')
    ? { ids: items.map((item) => item.id), total: body?.meta?.total }
    : null;
}

function executeLookup(measure) {
  login();
  const listStart = Date.now();
  const first = http.get(origin + '/api/v1/clubs?sort=code:asc&pageSize=20&page=1');
  const second = http.get(origin + '/api/v1/clubs?sort=code:asc&pageSize=20&page=2');
  const listDuration = Date.now() - listStart;
  const firstPage = pageData(first);
  const secondPage = pageData(second);
  const ids = [...(firstPage?.ids ?? []), ...(secondPage?.ids ?? [])];
  const validPages =
    firstPage?.ids.length === 20 &&
    secondPage?.ids.length === 5 &&
    firstPage.ids.every((id, index) => id === fixture.expectedIds[index]) &&
    secondPage.ids.every((id, index) => id === fixture.expectedIds[index + 20]) &&
    ids.length === 25 &&
    new Set(ids).size === 25 &&
    fixture.expectedIds.every((id) => ids.includes(id)) &&
    firstPage.total === 25 &&
    secondPage.total === 25;
  const searchStart = Date.now();
  const search = http.get(origin + '/api/v1/clubs?search=' + encodeURIComponent(fixture.search));
  const searchDuration = Date.now() - searchStart;
  const detailStart = Date.now();
  const detail = http.get(origin + '/api/v1/clubs/' + fixture.targetId);
  const detailDuration = Date.now() - detailStart;
  const searchData = pageData(search);
  const validSearch =
    searchData?.total === 1 &&
    searchData.ids.length === 1 &&
    searchData.ids[0] === fixture.targetId;
  const validDetail = payload(detail)?.data?.id === fixture.targetId;
  if (measure) {
    samples.add(1);
    complete.add(validPages);
    accepted.add(validPages && validSearch && validDetail);
    for (const [group, valid, duration] of [
      ['list', validPages, listDuration],
      ['search', validSearch, searchDuration],
      ['detail', validDetail, detailDuration],
    ]) {
      latency[group].add(duration);
      within[group].add(valid && duration <= 2000);
    }
  }
  sleep(0.25);
}
function lookup(measure) {
  try {
    executeLookup(measure);
  } catch (error) {
    exec.test.abort(
      error === authenticationFailure
        ? 'Club lookup authentication failed.'
        : 'Club lookup attempt failed.',
    );
  }
}
export function warmup() {
  lookup(false);
}
export function measured() {
  lookup(true);
}
