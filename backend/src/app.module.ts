import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './platform/database.service';
import { AdmissionService } from './platform/admission.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TechnicalCleanupService } from './operations/technical-cleanup.service';
import { AuthController } from './identity-access/auth.controller';
import { CsrfService } from './identity-access/csrf.service';
import { AuthService } from './identity-access/auth.service';
import { AccountsController } from './identity-access/accounts.controller';
import { AccountsService } from './identity-access/accounts.service';
import { AdministrationExecution } from './identity-access/administration-execution';
import { GrantsController } from './identity-access/grants.controller';
import { GrantsService } from './identity-access/grants.service';
import { DelegationsController } from './identity-access/delegations.controller';
import { DelegationProposalService } from './identity-access/delegation-proposal.service';
import { AuditController } from './audit/audit.controller';
import { AuditQueryService } from './audit/audit-query.service';
import { BusinessHistoryService } from './audit/business-history.service';
import { AuditWriterService } from './audit/audit-writer.service';
import { BusinessExecutionService } from './platform/business-execution';
import { HttpBusinessExecutionAdapter } from './platform/http-business-execution';
import {
  registerDependencyModules,
  SeasonDependenciesService,
} from './season-regulations/season-dependencies.service';
import type { DependencyModuleRegistration } from './season-regulations/season-dependencies.port';
import { SeasonsController } from './season-regulations/seasons.controller';
import { ClubsController } from './registry-registration/clubs.controller';
import { ClubsService } from './registry-registration/clubs.service';
import { LocalMediaStore } from './media/local-media.store';
import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';
import { MasterAvailabilityService } from './platform/master-availability';
import { MasterCorrectionImpactService } from './platform/master-correction-impact';
import { StadiumsController } from './scheduling/stadiums.controller';
import { StadiumsService } from './scheduling/stadiums.service';
import { SeasonLifecycleController } from './season-regulations/season-lifecycle.controller';
import { SeasonLifecycleService } from './season-regulations/season-lifecycle.service';
import { SeasonsService } from './season-regulations/seasons.service';
import { RegulationsController } from './season-regulations/regulations.controller';
import { RegulationsService } from './season-regulations/regulations.service';
import { RegulationActivationService } from './season-regulations/regulation-activation.service';
import { RegulationDecisionService } from './season-regulations/regulation-decision.service';
import { RegulationJobsService } from './season-regulations/regulation-jobs.service';
import { RegulationChangesController } from './season-regulations/regulation-changes.controller';
import { RegulationChangeService } from './season-regulations/regulation-change.service';
import { registryRegistrationDependencyModule } from './registry-registration/registration-dependency-facts';
import { ReceiptExceptionsController } from './registry-registration/receipt-exceptions.controller';
import { RegistrationIntakeService } from './registry-registration/registration-intake.service';
import { ClubApplicationCorrectionsController } from './registry-registration/club-application-corrections.controller';
import { ClubApplicationCorrectionsService } from './registry-registration/club-application-corrections.service';
import { ClubApplicationsController } from './registry-registration/club-applications.controller';
import { ClubApplicationsService } from './registry-registration/club-applications.service';
import { PlayersController } from './registry-registration/players.controller';
import { PlayersService } from './registry-registration/players.service';
import { PlayerPortraitsController } from './registry-registration/player-portraits.controller';
import { PlayerPortraitsService } from './registry-registration/player-portraits.service';
import { PlayerRegistrationsController } from './registry-registration/player-registrations.controller';
import { PlayerRegistrationsService } from './registry-registration/player-registrations.service';

// Register live PHASE 3 dependency facts before exposing owning writers; later phases remain absent.
const installedDependencyModules: readonly DependencyModuleRegistration[] = [
  registryRegistrationDependencyModule,
];

/** Builds the current static source catalog and checks it when a database is configured. */
export async function createSeasonDependenciesService(
  database: DatabaseService | null,
): Promise<SeasonDependenciesService> {
  const registration = registerDependencyModules(installedDependencyModules);
  const dependencies = new SeasonDependenciesService(registration);
  if (database) await database.client.$transaction((tx) => dependencies.assertStartupCatalog(tx));
  return dependencies;
}

@Controller(['health', 'api/v1/health'])
class HealthController {
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}

@Controller(['ready', 'api/v1/ready'])
class ReadinessController {
  @Get()
  async ready(): Promise<{ status: string }> {
    let database: DatabaseService | undefined;
    try {
      database = new DatabaseService(process.env.DATABASE_URL ?? '');
      const state = await database.client.maintenanceState.findUniqueOrThrow({
        where: { singletonId: 1 },
      });
      if (
        state.closed ||
        (await new AdmissionService(process.env.MAINTENANCE_MARKER_PATH).hostClosed())
      )
        throw new Error('Maintenance');
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Hệ thống chưa sẵn sàng.');
    } finally {
      await database?.close();
    }
  }
}

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    HealthController,
    ReadinessController,
    AuthController,
    AccountsController,
    GrantsController,
    DelegationsController,
    AuditController,
    SeasonsController,
    SeasonLifecycleController,
    ClubsController,
    StadiumsController,
    MediaController,
    RegulationsController,
    RegulationChangesController,
    ReceiptExceptionsController,
    ClubApplicationCorrectionsController,
    ClubApplicationsController,
    PlayersController,
    PlayerPortraitsController,
    PlayerRegistrationsController,
  ],
  providers: [
    {
      provide: PlayersService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, BusinessHistoryService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new PlayersService(execution, audit, history),
    },
    {
      provide: PlayerPortraitsService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, LocalMediaStore],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        storage: LocalMediaStore,
      ) => new PlayerPortraitsService(execution, audit, storage),
    },
    {
      provide: RegistrationIntakeService,
      inject: [HttpBusinessExecutionAdapter, RegulationActivationService, AuditWriterService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        activation: RegulationActivationService,
        audit: AuditWriterService,
      ) => new RegistrationIntakeService(execution, activation, audit),
    },
    {
      provide: ClubApplicationCorrectionsService,
      inject: [HttpBusinessExecutionAdapter, RegulationActivationService, AuditWriterService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        activation: RegulationActivationService,
        audit: AuditWriterService,
      ) => new ClubApplicationCorrectionsService(execution, activation, audit),
    },
    {
      provide: ClubApplicationsService,
      inject: [
        HttpBusinessExecutionAdapter,
        RegulationActivationService,
        RegistrationIntakeService,
        AuditWriterService,
        BusinessHistoryService,
      ],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        activation: RegulationActivationService,
        intake: RegistrationIntakeService,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new ClubApplicationsService(execution, activation, intake, audit, history),
    },
    {
      provide: PlayerRegistrationsService,
      inject: [
        HttpBusinessExecutionAdapter,
        RegulationActivationService,
        RegistrationIntakeService,
        AuditWriterService,
        BusinessHistoryService,
      ],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        activation: RegulationActivationService,
        intake: RegistrationIntakeService,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new PlayerRegistrationsService(execution, activation, intake, audit, history),
    },
    {
      provide: MasterCorrectionImpactService,
      inject: [HttpBusinessExecutionAdapter, SeasonDependenciesService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        dependencies: SeasonDependenciesService,
      ) => new MasterCorrectionImpactService(execution, dependencies),
    },
    {
      provide: SeasonLifecycleService,
      inject: [HttpBusinessExecutionAdapter, SeasonDependenciesService, AuditWriterService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        dependencies: SeasonDependenciesService,
        audit: AuditWriterService,
      ) => new SeasonLifecycleService(execution, dependencies, audit),
    },
    {
      provide: StadiumsService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, BusinessHistoryService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new StadiumsService(execution, audit, history),
    },
    {
      provide: MasterAvailabilityService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService],
      useFactory: (execution: HttpBusinessExecutionAdapter, audit: AuditWriterService) =>
        new MasterAvailabilityService(execution, audit),
    },
    { provide: LocalMediaStore, useFactory: () => new LocalMediaStore() },
    {
      provide: MediaService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, LocalMediaStore],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        storage: LocalMediaStore,
      ) => new MediaService(execution, audit, storage),
    },
    {
      provide: ClubsService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, BusinessHistoryService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new ClubsService(execution, audit, history),
    },
    {
      provide: AuditWriterService,
      useFactory: () => new AuditWriterService(),
    },
    {
      provide: BusinessExecutionService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService | null) =>
        database ? new BusinessExecutionService(database) : null,
    },
    {
      provide: HttpBusinessExecutionAdapter,
      inject: [AuthService, BusinessExecutionService],
      useFactory: (auth: AuthService, execution: BusinessExecutionService | null) =>
        execution ? new HttpBusinessExecutionAdapter(auth, execution) : null,
    },
    {
      provide: BusinessHistoryService,
      inject: [DatabaseService, AuthService],
      useFactory: (database: DatabaseService | null, auth: AuthService) =>
        database ? new BusinessHistoryService(database, auth) : null,
    },
    {
      provide: SeasonsService,
      inject: [HttpBusinessExecutionAdapter, AuditWriterService, BusinessHistoryService],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        history: BusinessHistoryService,
      ) => new SeasonsService(execution, audit, history),
    },
    {
      provide: RegulationsService,
      inject: [
        HttpBusinessExecutionAdapter,
        AuditWriterService,
        BusinessHistoryService,
        RegulationDecisionService,
        RegulationActivationService,
      ],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        audit: AuditWriterService,
        history: BusinessHistoryService,
        decisions: RegulationDecisionService,
        activation: RegulationActivationService,
      ) => new RegulationsService(execution, audit, history, decisions, activation),
    },
    {
      provide: RegulationActivationService,
      inject: [SeasonDependenciesService, AuditWriterService],
      useFactory: (dependencies: SeasonDependenciesService, audit: AuditWriterService) =>
        new RegulationActivationService(dependencies, audit),
    },
    {
      provide: RegulationChangeService,
      inject: [
        HttpBusinessExecutionAdapter,
        RegulationActivationService,
        RegulationDecisionService,
        AuditWriterService,
      ],
      useFactory: (
        execution: HttpBusinessExecutionAdapter,
        activation: RegulationActivationService,
        decisions: RegulationDecisionService,
        audit: AuditWriterService,
      ) => new RegulationChangeService(execution, activation, decisions, audit),
    },
    {
      provide: RegulationJobsService,
      inject: [DatabaseService, BusinessExecutionService, RegulationActivationService],
      useFactory: (
        database: DatabaseService | null,
        execution: BusinessExecutionService | null,
        activation: RegulationActivationService,
      ) => new RegulationJobsService(database, execution, activation),
    },
    {
      provide: RegulationDecisionService,
      inject: [RegulationActivationService, AuditWriterService],
      useFactory: (activation: RegulationActivationService, audit: AuditWriterService) =>
        new RegulationDecisionService(activation, audit),
    },
    {
      provide: SeasonDependenciesService,
      inject: [DatabaseService],
      useFactory: createSeasonDependenciesService,
    },
    {
      provide: AuditQueryService,
      inject: [DatabaseService, AuthService],
      useFactory: (database: DatabaseService, auth: AuthService) =>
        new AuditQueryService(database, auth),
    },
    {
      provide: DelegationProposalService,
      inject: [AdministrationExecution],
      useFactory: (execution: AdministrationExecution) => new DelegationProposalService(execution),
    },
    {
      provide: GrantsService,
      inject: [AdministrationExecution],
      useFactory: (execution: AdministrationExecution) => new GrantsService(execution),
    },
    {
      provide: AdministrationExecution,
      inject: [DatabaseService, AuthService],
      useFactory: (database: DatabaseService, auth: AuthService) =>
        new AdministrationExecution(database, auth),
    },
    {
      provide: AccountsService,
      inject: [AdministrationExecution],
      useFactory: (execution: AdministrationExecution) => new AccountsService(execution),
    },
    {
      provide: DatabaseService,
      useFactory: () =>
        process.env.DATABASE_URL ? new DatabaseService(process.env.DATABASE_URL) : null,
    },
    {
      provide: CsrfService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new CsrfService(database),
    },
    {
      provide: AuthService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new AuthService(database),
    },
    {
      provide: TechnicalCleanupService,
      useFactory: () =>
        new TechnicalCleanupService(
          process.env.DATABASE_URL ? new DatabaseService(process.env.DATABASE_URL) : undefined,
        ),
    },
  ],
  exports: [
    AuditWriterService,
    BusinessExecutionService,
    HttpBusinessExecutionAdapter,
    BusinessHistoryService,
    SeasonDependenciesService,
  ],
})
export class AppModule {}
