import { runOperator, commandArguments } from './operator-runtime';
import { MaintenanceService } from '../operations/maintenance.service';

if (require.main === module)
  void runOperator(async (database) => {
    const args = commandArguments([
      '--action',
      '--kind',
      '--reason',
      '--operation-id',
      '--set-path',
    ]);
    const maintenance = new MaintenanceService(database, process.env.MAINTENANCE_MARKER_PATH ?? '');
    switch (args['--action']) {
      case 'close':
        await maintenance.close(
          args['--kind'],
          args['--reason'],
          args['--operation-id'],
          args['--set-path'] === '-' ? undefined : args['--set-path'],
        );
        break;
      case 'verify':
        await maintenance.verify(args['--operation-id']);
        break;
      case 'release':
        await maintenance.release(args['--operation-id']);
        break;
      case 'status':
        console.log(JSON.stringify(await maintenance.status()));
        break;
      default:
        throw new Error('Invalid maintenance action.');
    }
  });
