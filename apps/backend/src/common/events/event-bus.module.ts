import { Module, Global } from '@nestjs/common'
import { InMemoryEventBus } from './in-memory-event-bus'

@Global()
@Module({
  providers: [InMemoryEventBus],
  exports: [InMemoryEventBus],
})
export class EventBusModule {}
