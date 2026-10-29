import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './platform/database.service';
import { AdmissionService } from './platform/admission.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TechnicalCleanupService } from './operations/technical-cleanup.service';
import { AuthController } from './identity-access/auth.controller';
import { CsrfService } from './identity-access/csrf.service';
import { AuthService } from './identity-access/auth.service';

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
  controllers: [HealthController, ReadinessController, AuthController],
  providers: [
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
})
export class AppModule {}
