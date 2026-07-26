import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { OrderService } from './order.service'
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto'

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order after winning an auction' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser('sub') userId: string) {
    const order = await this.orderService.create(dto, userId)
    return { success: true, data: order }
  }

  @Get('buying')
  @ApiOperation({ summary: 'Get my orders as buyer' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyBuyerOrders(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.orderService.getMyOrdersAsBuyer(userId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }

  @Get('selling')
  @ApiOperation({ summary: 'Get my orders as seller' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMySellerOrders(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.orderService.getMyOrdersAsSeller(userId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiParam({ name: 'id', type: 'string' })
  async getOrder(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const order = await this.orderService.getOrder(id, userId)
    return { success: true, data: order }
  }

  @Patch(':id/shipping')
  @ApiOperation({ summary: 'Update shipping info (seller only)' })
  @ApiParam({ name: 'id', type: 'string' })
  async updateShipping(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser('sub') userId: string,
  ) {
    const result = await this.orderService.updateShipping(id, dto, userId)
    return { success: true, data: result }
  }
}
