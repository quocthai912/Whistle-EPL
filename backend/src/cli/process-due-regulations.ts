import { createSeasonDependenciesService } from '../app.module';
import { AuditWriterService } from '../audit/audit-writer.service';
import { BusinessExecutionService } from '../platform/business-execution';
import { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import { RegulationJobsService } from '../season-regulations/regulation-jobs.service';
import { commandArguments, runOperator } from './operator-runtime';

if (require.main === module)
  void runOperator(async (database, identity) => {
    commandArguments([]);
    const dependencies = await createSeasonDependenciesService(database);
    const jobs = new RegulationJobsService(
      database,
      new BusinessExecutionService(database),
      new RegulationActivationService(dependencies, new AuditWriterService()),
    );
    const outcome = await jobs.processDue({ kind: 'operator', identity });
    console.log(JSON.stringify({ event: 'REGULATION_DUE_OPERATOR_RESULT', ...outcome }));
    if (outcome.failed) throw new Error('Some due regulations require another attempt.');
  });
