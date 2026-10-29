import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './platform/database.service';
import { AdmissionService } from './platform/admission.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TechnicalCleanupService } from './operations/technical-cleanup.service';

@Controller('health')
class HealthController {
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}

@Controller('ready')
class ReadinessController {
  @Get()
  async ready(): Promise<{ status: string }> {
    const database = new DatabaseService(process.env.DATABASE_URL ?? '');
    try {
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
      await database.close();
    }
  }
}

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [HealthController, ReadinessController],
  providers: [
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
