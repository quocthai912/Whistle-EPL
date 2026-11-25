import { runCommittedRace } from '../fixtures/committed-race';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('committed race cleanup', () => {
  it('drains a started request after polling fails and preserves that failure if release also fails', async () => {
    const request = deferred<number>();
    const pollingFailure = new Error('polling failed');
    let settled = false;
    const race = runCommittedRace<number>(
      async () => {
        request.resolve(200);
        throw new Error('release failed');
      },
      async (start) => {
        start(
          request.promise.then((value) => {
            settled = true;
            return value;
          }),
        );
        throw pollingFailure;
      },
    );
    await expect(race).rejects.toBe(pollingFailure);
    expect(settled).toBe(true);
  });

  it('settles every started request when release fails, including a rejected request', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    const releaseFailure = new Error('release failed');
    let secondSettled = false;
    const race = runCommittedRace<number>(
      async () => {
        first.reject(new Error('request failed'));
        second.resolve(409);
        throw releaseFailure;
      },
      async (start) => {
        start(first.promise);
        start(
          second.promise.then((value) => {
            secondSettled = true;
            return value;
          }),
        );
      },
    );
    await expect(race).rejects.toBe(releaseFailure);
    expect(secondSettled).toBe(true);
  });

  it('returns successful responses in start order only after release and settlement', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    await expect(
      runCommittedRace<number>(
        async () => {
          second.resolve(409);
          first.resolve(200);
        },
        async (start) => {
          start(first.promise);
          start(second.promise);
        },
      ),
    ).resolves.toEqual([200, 409]);
  });

  it('propagates a request rejection after draining the other requests', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    const requestFailure = new Error('request failed');
    let drained = false;
    const race = runCommittedRace<number>(
      async () => {
        first.reject(requestFailure);
        second.resolve(200);
      },
      async (start) => {
        start(first.promise);
        start(
          second.promise.then((value) => {
            drained = true;
            return value;
          }),
        );
      },
    );
    await expect(race).rejects.toBe(requestFailure);
    expect(drained).toBe(true);
  });
});
