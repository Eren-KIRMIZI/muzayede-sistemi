import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { BidService } from './bid.service'
import { PlaceBidDto } from './dto/place-bid.dto'

@ApiTags('Bids')
@Controller('auctions/:auctionId/bids')
export class BidController {
  constructor(private bidService: BidService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a bid on an auction' })
  async placeBid(
    @Param('auctionId') auctionId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: PlaceBidDto,
  ) {
    const bid = await this.bidService.placeBid(auctionId, userId, dto)
    return { success: true, data: bid }
  }

  @Get()
  @ApiOperation({ summary: 'Get bid history for an auction' })
  async getBidHistory(
    @Param('auctionId') auctionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.bidService.getBidHistory(auctionId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get bid summary for an auction' })
  async getBidSummary(@Param('auctionId') auctionId: string) {
    const summary = await this.bidService.getBidSummary(auctionId)
    return { success: true, data: summary }
  }
}

@ApiTags('Bids')
@Controller('users/me/bids')
export class UserBidController {
  constructor(private bidService: BidService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bids' })
  async getMyBids(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.bidService.getUserBids(userId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }
}
