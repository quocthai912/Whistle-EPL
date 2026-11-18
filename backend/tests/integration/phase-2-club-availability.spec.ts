import { assertAvailableForNewUse } from '../../src/platform/master-availability';
import { setupMasterHttpFixture, waitBehindMasterUse } from '../fixtures/phase-2-master-http';

describe('PHASE 2 Club availability', () => {
  const http = setupMasterHttpFixture();
  const { database, createClub, readClub, clubManager, writeMaster, club } = http;

  it('discontinues and resumes the same Club and checks final availability under its lock', async () => {
    const tokens = await clubManager();
    const id = (await createClub(tokens, club).expect(201)).body.data.id as string;
    const allowedForNewUse = () =>
      database.write(
        [{ kind: 'club', key: id, mode: 'exclusive' }],
        async () => {},
        (context) => assertAvailableForNewUse(context, 'club', id),
      );
    await expect(allowedForNewUse()).resolves.toBeUndefined();
    const { waiting, response: stop } = await waitBehindMasterUse(database, 'club', id, () =>
      writeMaster(tokens, 'post', `/clubs/${id}/discontinue`, {
        expectedRevision: '1',
        reason: 'Hồ sơ đã ngừng sử dụng.',
      }).expect(200),
    );
    expect(waiting).toBe(true);
    expect(stop.body.data).toMatchObject({ id, revision: '2', discontinuedAt: expect.any(String) });
    await expect(allowedForNewUse()).rejects.toMatchObject({ code: 'MASTER_DISCONTINUED' });
    expect((await readClub(tokens, '?availability=ACTIVE').expect(200)).body.data.items).toEqual(
      [],
    );
    await writeMaster(tokens, 'post', `/clubs/${id}/resume`, {
      expectedRevision: '1',
      reason: 'Không còn đúng phiên bản.',
    }).expect(409);
    await writeMaster(tokens, 'post', `/clubs/${id}/resume`, {
      expectedRevision: '2',
      reason: 'Đã được dùng trở lại.',
    }).expect(200);
    await expect(allowedForNewUse()).resolves.toBeUndefined();
    const history = (await readClub(tokens, `/${id}/history`).expect(200)).body.data.items;
    expect(history.map((item: { actionCode: string }) => item.actionCode)).toEqual([
      'CLUB_RESUMED',
      'CLUB_DISCONTINUED',
      'CLUB_CREATED',
    ]);
  });
});
