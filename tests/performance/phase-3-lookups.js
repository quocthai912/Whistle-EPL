import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const origin = __ENV.PHASE3_ORIGIN;
if (
  __ENV.PHASE3_ISOLATED !== 'ISOLATED_PHASE3_LOOKUP' ||
  !/^https:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin ?? '') ||
  !__ENV.PHASE3_FIXTURE
) {
  throw new Error('Explicit isolated HTTPS origin and protected Phase 3 fixture required.');
}

const fixture = JSON.parse(open(__ENV.PHASE3_FIXTURE));
if (
  fixture.evidenceKind !== 'ISOLATED_TEST_FIXTURE' ||
  fixture.accounts?.length !== 20 ||
  !fixture.accounts.every(
    (account) =>
      /^p3\.lookup\.\d{2}$/.test(account.username) && typeof account.password === 'string',
  ) ||
  fixture.totals?.clubs !== 20 ||
  fixture.totals?.players !== 600 ||
  fixture.totals?.portraits < 200 ||
  fixture.totals?.clubApplications !== 20 ||
  fixture.totals?.registrations !== 600 ||
  fixture.totals?.perClub !== 30 ||
  fixture.playerPage1Ids?.length !== 20 ||
  fixture.playerPage2Ids?.length !== 20 ||
  fixture.clubAppExpectedIds?.length !== 20 ||
  fixture.registrationPage1Ids?.length !== 20 ||
  fixture.registrationPage2Ids?.length !== 20 ||
  fixture.clubRegistrationPage1Ids?.length !== 20 ||
  fixture.clubRegistrationPage2Ids?.length !== 10 ||
  fixture.samplePortraits?.length < 200 ||
  !fixture.seasonId ||
  !fixture.playerSearch ||
  !fixture.clubAppSearch ||
  !fixture.registrationSearch ||
  !fixture.targetPlayerId ||
  !fixture.targetClubAppId ||
  !fixture.targetClubId ||
  !fixture.targetRegistrationId
) {
  throw new Error('Use the declared 20-user, 20-club, 600-player isolated Phase 3 lookup fixture.');
}

const accepted = new Rate('phase3_lookup_success');
const samples = new Counter('phase3_lookup_samples');
const complete = new Rate('phase3_paging_complete');
const authenticationFailure = new Error('Synthetic Phase 3 lookup authentication failed.');

const latency = {
  playerList: new Trend('p3_player_list_ms', true),
  playerSearch: new Trend('p3_player_search_ms', true),
  playerDetailPortrait: new Trend('p3_player_detail_portrait_ms', true),
  clubApplications: new Trend('p3_club_applications_ms', true),
  registrationListPaging: new Trend('p3_registration_list_paging_ms', true),
  registrationSearchDetail: new Trend('p3_registration_search_detail_ms', true),
};

const within = {
  playerList: new Rate('p3_player_list_within_2s'),
  playerSearch: new Rate('p3_player_search_within_2s'),
  playerDetailPortrait: new Rate('p3_player_detail_portrait_within_2s'),
  clubApplications: new Rate('p3_club_applications_within_2s'),
  registrationListPaging: new Rate('p3_registration_list_paging_within_2s'),
  registrationSearchDetail: new Rate('p3_registration_search_detail_within_2s'),
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
    phase3_lookup_samples: ['count>0'],
    phase3_lookup_success: ['rate==1'],
    phase3_paging_complete: ['rate==1'],
    p3_player_list_within_2s: ['rate>=0.95'],
    p3_player_search_within_2s: ['rate>=0.95'],
    p3_player_detail_portrait_within_2s: ['rate>=0.95'],
    p3_club_applications_within_2s: ['rate>=0.95'],
    p3_registration_list_paging_within_2s: ['rate>=0.95'],
    p3_registration_search_detail_within_2s: ['rate>=0.95'],
  },
};

function login() {
  if (http.cookieJar().cookiesForURL(origin)['__Host-whistle-session']?.length) return;
  const account = fixture.accounts[Math.max(0, exec.vu.idInTest - 1) % 20];
  const csrfResponse = http.get(origin + '/api/v1/auth/csrf');
  const csrf = csrfResponse.status === 200 ? csrfResponse.json('data.csrfToken') : null;
  if (!csrf) throw authenticationFailure;
  const response = http.post(origin + '/api/v1/auth/login', JSON.stringify(account), {
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  });
  if (response.status !== 200 || response.json('data.changeRequired') !== false) {
    throw authenticationFailure;
  }
}

export function setup() {
  const ready = http.get(origin + '/ready', { timeout: '10s' });
  if (ready.status !== 200) throw new Error('Isolated Phase 3 lookup backend is not ready.');
  login();
  const playersProbe = http.get(origin + '/api/v1/players?pageSize=20&page=1');
  if (playersProbe.status !== 200 || playersProbe.json('meta.total') !== 600) {
    throw new Error('Authenticated 600-player fixture is unavailable.');
  }
  const appsProbe = http.get(
    origin + `/api/v1/seasons/${fixture.seasonId}/club-applications?pageSize=20&page=1`,
  );
  if (appsProbe.status !== 200 || appsProbe.json('meta.total') !== 20) {
    throw new Error('Authenticated 20-club BM1 fixture is unavailable.');
  }
  const regsProbe = http.get(
    origin + `/api/v1/seasons/${fixture.seasonId}/player-registrations?pageSize=20&page=1`,
  );
  if (regsProbe.status !== 200 || regsProbe.json('meta.total') !== 600) {
    throw new Error('Authenticated 600-registration fixture is unavailable.');
  }
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

function matchesExactIds(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((id, index) => id === expected[index])
  );
}

function isWebpResponse(response, expectedSize) {
  if (response.status !== 200) return false;
  const contentType = String(
    response.headers['Content-Type'] ?? response.headers['content-type'] ?? '',
  ).toLowerCase();
  const cacheControl = String(
    response.headers['Cache-Control'] ?? response.headers['cache-control'] ?? '',
  ).toLowerCase();
  if (!contentType.includes('image/webp') || !cacheControl.includes('no-store')) return false;
  const bytes = new Uint8Array(response.body);
  return (
    bytes.length === expectedSize &&
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function executeLookup(measure) {
  login();
  const vuIndex = Math.max(0, exec.vu.idInTest - 1);
  const portraitSample =
    fixture.samplePortraits[
      (vuIndex + exec.vu.iterationInScenario * 20) % fixture.samplePortraits.length
    ];

  // Group 1: Player list & >20 pagination (600 profiles)
  const playerListStart = Date.now();
  const pPage1 = http.get(origin + '/api/v1/players?sort=code:asc&pageSize=20&page=1');
  const pPage2 = http.get(origin + '/api/v1/players?sort=code:asc&pageSize=20&page=2');
  const playerListDuration = Date.now() - playerListStart;
  const p1 = pageData(pPage1);
  const p2 = pageData(pPage2);
  const validPlayerList =
    p1?.total === 600 &&
    p2?.total === 600 &&
    matchesExactIds(p1.ids, fixture.playerPage1Ids) &&
    matchesExactIds(p2.ids, fixture.playerPage2Ids) &&
    new Set([...p1.ids, ...p2.ids]).size === 40;

  // Group 2: Player Vietnamese diacritic search
  const playerSearchStart = Date.now();
  const pSearch = http.get(
    origin + '/api/v1/players?search=' + encodeURIComponent(fixture.playerSearch),
  );
  const playerSearchDuration = Date.now() - playerSearchStart;
  const pSearchData = pageData(pSearch);
  const validPlayerSearch =
    pSearchData?.total === 1 &&
    pSearchData.ids.length === 1 &&
    pSearchData.ids[0] === fixture.targetPlayerId;

  // Group 3: Player detail + actual managed WebP portrait delivery from storage
  const playerDetailStart = Date.now();
  const pDetail = http.get(origin + '/api/v1/players/' + portraitSample.playerId);
  const pMedia = http.get(origin + '/api/v1/media/' + portraitSample.portraitId, {
    responseType: 'binary',
  });
  const playerDetailDuration = Date.now() - playerDetailStart;
  const detailPayload = payload(pDetail);
  const validPlayerDetailPortrait =
    detailPayload?.data?.id === portraitSample.playerId &&
    detailPayload?.data?.portrait?.id === portraitSample.portraitId &&
    isWebpResponse(pMedia, portraitSample.byteSize);

  // Group 4: Club participation applications (BM1 list, Vietnamese search, detail)
  const clubAppsStart = Date.now();
  const appList = http.get(
    origin + `/api/v1/seasons/${fixture.seasonId}/club-applications?sort=id:asc&pageSize=20&page=1`,
  );
  const appSearch = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/club-applications?search=` +
      encodeURIComponent(fixture.clubAppSearch),
  );
  const appDetail = http.get(origin + '/api/v1/club-applications/' + fixture.targetClubAppId);
  const clubAppsDuration = Date.now() - clubAppsStart;
  const appListData = pageData(appList);
  const appSearchData = pageData(appSearch);
  const appDetailData = payload(appDetail)?.data;
  const validClubApps =
    appListData?.total === 20 &&
    matchesExactIds(appListData.ids, fixture.clubAppExpectedIds) &&
    appSearchData?.total === 1 &&
    appSearchData.ids.length === 1 &&
    appSearchData.ids[0] === fixture.targetClubAppId &&
    appDetailData?.id === fixture.targetClubAppId;

  // Group 5: Seasonal player registrations (>20 pagination across 600 season & 30-per-club)
  const regListStart = Date.now();
  const rPage1 = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/player-registrations?sort=id:asc&pageSize=20&page=1`,
  );
  const rPage2 = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/player-registrations?sort=id:asc&pageSize=20&page=2`,
  );
  const rcPage1 = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/player-registrations?clubId=${fixture.targetClubId}&sort=id:asc&pageSize=20&page=1`,
  );
  const rcPage2 = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/player-registrations?clubId=${fixture.targetClubId}&sort=id:asc&pageSize=20&page=2`,
  );
  const regListDuration = Date.now() - regListStart;
  const r1 = pageData(rPage1);
  const r2 = pageData(rPage2);
  const rc1 = pageData(rcPage1);
  const rc2 = pageData(rcPage2);
  const validRegListPaging =
    r1?.total === 600 &&
    r2?.total === 600 &&
    matchesExactIds(r1.ids, fixture.registrationPage1Ids) &&
    matchesExactIds(r2.ids, fixture.registrationPage2Ids) &&
    new Set([...r1.ids, ...r2.ids]).size === 40 &&
    rc1?.total === 30 &&
    rc2?.total === 30 &&
    matchesExactIds(rc1.ids, fixture.clubRegistrationPage1Ids) &&
    matchesExactIds(rc2.ids, fixture.clubRegistrationPage2Ids) &&
    new Set([...rc1.ids, ...rc2.ids]).size === 30;

  // Group 6: Seasonal player registrations Vietnamese search & detail
  const regSearchStart = Date.now();
  const rSearch = http.get(
    origin +
      `/api/v1/seasons/${fixture.seasonId}/player-registrations?search=` +
      encodeURIComponent(fixture.registrationSearch),
  );
  const rDetail = http.get(origin + '/api/v1/player-registrations/' + fixture.targetRegistrationId);
  const regSearchDuration = Date.now() - regSearchStart;
  const rSearchData = pageData(rSearch);
  const rDetailData = payload(rDetail)?.data;
  const validRegSearchDetail =
    rSearchData?.total === 1 &&
    rSearchData.ids.length === 1 &&
    rSearchData.ids[0] === fixture.targetRegistrationId &&
    rDetailData?.id === fixture.targetRegistrationId;

  if (measure) {
    samples.add(1);
    complete.add(validPlayerList && validRegListPaging && validClubApps);
    accepted.add(
      validPlayerList &&
        validPlayerSearch &&
        validPlayerDetailPortrait &&
        validClubApps &&
        validRegListPaging &&
        validRegSearchDetail,
    );
    for (const [group, valid, duration] of [
      ['playerList', validPlayerList, playerListDuration],
      ['playerSearch', validPlayerSearch, playerSearchDuration],
      ['playerDetailPortrait', validPlayerDetailPortrait, playerDetailDuration],
      ['clubApplications', validClubApps, clubAppsDuration],
      ['registrationListPaging', validRegListPaging, regListDuration],
      ['registrationSearchDetail', validRegSearchDetail, regSearchDuration],
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
        ? 'Phase 3 lookup authentication failed.'
        : 'Phase 3 lookup attempt failed.',
    );
  }
}

export function warmup() {
  lookup(false);
}

export function measured() {
  lookup(true);
}
