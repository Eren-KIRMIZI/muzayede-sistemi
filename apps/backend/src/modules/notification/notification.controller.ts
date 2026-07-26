import {
  Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus, Sse, MessageEvent,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { NotificationService } from './notification.service'

@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const result = await this.notificationService.findAll(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
      unreadOnly === 'true',
    )
    return { success: true, ...result }
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for real-time notifications' })
  stream(@CurrentUser('sub') userId: string): Observable<MessageEvent> {
    return this.notificationService.getStream().pipe(
      filter(notification => notification.userId === userId),
      map(notification => ({
        data: notification,
      })),
    )
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    const result = await this.notificationService.getUnreadCount(userId)
    return { success: true, data: result }
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.notificationService.markAsRead(id, userId)
    return { success: true }
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    await this.notificationService.markAllAsRead(userId)
    return { success: true }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.notificationService.remove(id, userId)
    return { success: true }
  }
}
