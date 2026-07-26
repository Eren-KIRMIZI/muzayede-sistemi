import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { AuctionService } from './auction.service'
import { CreateAuctionDto } from './dto/create-auction.dto'
import { UpdateAuctionDto } from './dto/update-auction.dto'
import { QueryAuctionDto } from './dto/query-auction.dto'

@ApiTags('Auctions')
@Controller('auctions')
export class AuctionController {
  constructor(private auctionService: AuctionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new auction listing' })
  async create(@Body() dto: CreateAuctionDto, @CurrentUser('sub') userId: string) {
    const auction = await this.auctionService.create(dto, userId)
    return { success: true, data: auction }
  }

  @Get()
  @ApiOperation({ summary: 'List auctions with filters' })
  async findAll(@Query() query: QueryAuctionDto) {
    const result = await this.auctionService.findAll(query)
    return { success: true, ...result }
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    const categories = await this.auctionService.getCategories()
    return { success: true, data: categories }
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured auctions' })
  async getFeatured() {
    const auctions = await this.auctionService.getFeatured()
    return { success: true, data: auctions }
  }

  @Get('ending-soon')
  @ApiOperation({ summary: 'Get auctions ending soon' })
  async getEndingSoon() {
    const auctions = await this.auctionService.getEndingSoon()
    return { success: true, data: auctions }
  }

  @Get('watchlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user watchlist' })
  async getWatchlist(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.auctionService.getWatchlist(userId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }

  @Post(':id/watch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle watch on an auction' })
  async toggleWatch(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.auctionService.toggleWatch(id, userId)
    return { success: true, data: result }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction details' })
  async findOne(@Param('id') id: string) {
    const auction = await this.auctionService.findOne(id)
    return { success: true, data: auction }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update auction (draft only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAuctionDto,
    @CurrentUser('sub') userId: string,
  ) {
    const auction = await this.auctionService.update(id, dto, userId)
    return { success: true, data: auction }
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish draft auction' })
  async publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const auction = await this.auctionService.publish(id, userId)
    return { success: true, data: auction }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete draft auction' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.auctionService.remove(id, userId)
    return { success: true, ...result }
  }
}
