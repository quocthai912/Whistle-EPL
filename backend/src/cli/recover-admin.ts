import { RecoverAdminService } from './recover-admin.service';
import { commandArguments, runOperator } from './operator-runtime';
import { readSecret } from './secure-prompt';

if (require.main === module)
  void runOperator(async (database, identity) => {
    const args = commandArguments(['--target', '--reason', '--mode']);
    if (!['reset', 'unlock', 'reset-unlock'].includes(args['--mode']))
      throw new Error('Invalid recovery mode.');
    const reset = args['--mode'] !== 'unlock';
    const password = reset ? await readSecret() : undefined;
    await new RecoverAdminService(database).execute(
      {
        target: args['--target'],
        reason: args['--reason'],
        reset,
        unlock: args['--mode'] !== 'reset',
        password,
      },
      identity,
    );
  });
