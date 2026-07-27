import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { AdminService } from './admin.service'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('JWT-Auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboard() {
    const stats = await this.adminService.getDashboardStats()
    return { success: true, data: stats }
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['USER', 'SELLER', 'MODERATOR', 'ADMIN'] })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const result = await this.adminService.getUsers(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      role,
    )
    return { success: true, ...result }
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user profile' })
  @ApiParam({ name: 'id', type: 'string' })
  async getUserDetails(@Param('id') id: string) {
    const user = await this.adminService.getUserDetails(id)
    return { success: true, data: user }
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user account' })
  @ApiParam({ name: 'id', type: 'string' })
  async banUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    const result = await this.adminService.banUser(id, adminId, reason)
    return { success: true, ...result }
  }

  @Post('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban a user account' })
  @ApiParam({ name: 'id', type: 'string' })
  async unbanUser(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    const result = await this.adminService.unbanUser(id, adminId)
    return { success: true, ...result }
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id', type: 'string' })
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @CurrentUser('sub') adminId: string,
  ) {
    const result = await this.adminService.changeUserRole(id, role, adminId)
    return { success: true, ...result }
  }

  // ── Auctions ───────────────────────────────────────────────────────────────

  @Get('auctions')
  @ApiOperation({ summary: 'List all auctions with admin view' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PENDING', 'ACTIVE', 'ENDED', 'SOLD', 'CANCELLED'] })
  async getAuctions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getAuctions(Number(page) || 1, Number(limit) || 20, status)
    return { success: true, ...result }
  }

  @Post('auctions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an auction (admin override)' })
  @ApiParam({ name: 'id', type: 'string' })
  async cancelAuction(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    const result = await this.adminService.cancelAuction(id, adminId, reason)
    return { success: true, ...result }
  }

  @Patch('auctions/:id/feature')
  @ApiOperation({ summary: 'Set featured/hot status for an auction' })
  @ApiParam({ name: 'id', type: 'string' })
  async featureAuction(
    @Param('id') id: string,
    @Body('featured') featured: boolean,
    @Body('hot') hot: boolean,
    @CurrentUser('sub') adminId: string,
  ) {
    const result = await this.adminService.featureAuction(id, featured, hot, adminId)
    return { success: true, ...result }
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  @Get('payments')
  @ApiOperation({ summary: 'List all payments with admin view' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  async getPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getPayments(Number(page) || 1, Number(limit) || 20, status)
    return { success: true, ...result }
  }

  // ── Fraud ──────────────────────────────────────────────────────────────────

  @Get('fraud')
  @ApiOperation({ summary: 'List fraud events for review' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'REVIEWING', 'CONFIRMED', 'DISMISSED'] })
  async getFraudEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getFraudEvents(Number(page) || 1, Number(limit) || 20, status)
    return { success: true, ...result }
  }

  @Post('fraud/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a fraud event (CONFIRMED or DISMISSED)' })
  @ApiParam({ name: 'id', type: 'string' })
  async resolveFraud(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note: string,
    @CurrentUser('sub') adminId: string,
  ) {
    const result = await this.adminService.resolveFraudEvent(id, status, note, adminId)
    return { success: true, data: result }
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'View system audit logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'BID', 'PAYMENT'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    const result = await this.adminService.getAuditLogs(Number(page) || 1, Number(limit) || 50, action, userId)
    return { success: true, ...result }
  }
}
