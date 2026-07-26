import { Module, Global } from '@nestjs/common'
import { AuditLogService } from './audit.service'
import { AuditInterceptor } from './audit.interceptor'
import { PrismaModule } from '../../prisma/prisma.module'

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, AuditInterceptor],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditModule {}
