import { assertAvailableForNewUse } from '../../src/platform/master-availability';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { setupMasterHttpFixture, waitBehindMasterUse } from '../fixtures/phase-2-master-http';

describe('PHASE 2 Stadium availability', () => {
  const http = setupMasterHttpFixture();
  const { database, stadiumManager, writeMaster } = http;

  it('uses Stadium locks and rolls back a D099 change whose required audit fails', async () => {
    const tokens = await stadiumManager();
    const id = (
      await writeMaster(tokens, 'post', '/stadiums', {
        code: 'STADIUM_1',
        name: 'Sân kiểm thử',
      }).expect(201)
    ).body.data.id as string;
    const path = `/stadiums/${id}`;
    const stop = { expectedRevision: '1', reason: 'Sân phải ngừng sử dụng.' };
    const fail = jest
      .spyOn(http.app.get(AuditWriterService), 'append')
      .mockRejectedValueOnce(new Error('Injected fixture audit failure'));
    try {
      await writeMaster(tokens, 'post', path + '/discontinue', stop).expect(500);
    } finally {
      fail.mockRestore();
    }
    expect(await database.client.stadium.findUnique({ where: { id } })).toMatchObject({
      discontinuedAt: null,
      revision: 1n,
    });
    const actual = await waitBehindMasterUse(database, 'stadium', id, () =>
      writeMaster(tokens, 'post', path + '/discontinue', stop).expect(200),
    );
    expect(actual.waiting).toBe(true);
    const guard = () =>
      database.write(
        [{ kind: 'stadium', key: id, mode: 'exclusive' }],
        async () => {},
        (context) => assertAvailableForNewUse(context, 'stadium', id),
      );
    await expect(guard()).rejects.toMatchObject({ code: 'MASTER_DISCONTINUED' });
    await writeMaster(tokens, 'post', path + '/resume', {
      expectedRevision: '2',
      reason: 'Sân được dùng trở lại.',
    }).expect(200);
    await expect(guard()).resolves.toBeUndefined();
  });
});
