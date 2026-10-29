import { BootstrapAdminService } from './bootstrap-admin.service';
import { commandArguments, runOperator } from './operator-runtime';
import { readSecret } from './secure-prompt';

if (require.main === module)
  void runOperator(async (database, identity) => {
    const args = commandArguments(['--personnel-code', '--full-name', '--username']);
    const password = await readSecret();
    await new BootstrapAdminService(database).execute(
      {
        personnelCode: args['--personnel-code'],
        fullName: args['--full-name'],
        username: args['--username'],
        password,
      },
      identity,
    );
  });
