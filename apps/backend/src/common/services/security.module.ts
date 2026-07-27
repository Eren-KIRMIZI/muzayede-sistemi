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
      .forRoutes('{*path}')

    // CSRF middleware disabled: JWT-based SPA sends tokens via Authorization header,
    // not cookies, so CSRF attacks are not applicable here.
    // To re-enable, implement a CSRF token endpoint and have the frontend fetch + send tokens.
    // consumer
    //   .apply(CsrfMiddleware)
    //   .exclude(
    //     { path: '{*path}', method: RequestMethod.GET },
    //     { path: '{*path}', method: RequestMethod.HEAD },
    //     { path: '{*path}', method: RequestMethod.OPTIONS },
    //     { path: 'api/docs{*path}', method: RequestMethod.ALL },
    //   )
    //   .forRoutes('{*path}')
  }
}
