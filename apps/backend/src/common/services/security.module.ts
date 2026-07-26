import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common'
import { CsrfMiddleware } from '../middleware/csrf.middleware'
import { SanitizeMiddleware } from '../middleware/sanitize.middleware'

@Module({
  providers: [CsrfMiddleware, SanitizeMiddleware],
  exports: [CsrfMiddleware],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply sanitize middleware to all API routes
    consumer
      .apply(SanitizeMiddleware)
      .forRoutes({ path: 'api/v1/(.*)', method: RequestMethod.ALL })

    // Apply CSRF middleware to state-changing routes only
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/(.*)', method: RequestMethod.GET },
        { path: 'api/v1/(.*)', method: RequestMethod.HEAD },
        { path: 'api/v1/(.*)', method: RequestMethod.OPTIONS },
        { path: 'api/docs(.*)', method: RequestMethod.ALL },
      )
      .forRoutes({ path: 'api/v1/(.*)', method: RequestMethod.ALL })
  }
}
