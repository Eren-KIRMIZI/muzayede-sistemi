import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { ListingService } from './listing.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { FilterListingDto } from './dto/filter-listing.dto'

@ApiTags('Listings')
@Controller('listings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class ListingController {
  constructor(private listingService: ListingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new listing (starts as DRAFT)' })
  @ApiResponse({ status: 201, description: 'Listing created in DRAFT status' })
  async create(@Body() dto: CreateListingDto, @CurrentUser('sub') userId: string) {
    const listing = await this.listingService.create(dto, userId)
    return { success: true, data: listing }
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all my listings (all statuses)' })
  @ApiResponse({ status: 200, description: 'Paginated list of seller listings' })
  async findMy(@CurrentUser('sub') userId: string, @Query() query: FilterListingDto) {
    const result = await this.listingService.findMy(userId, query)
    return { success: true, ...result }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single listing (own only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Listing UUID' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const listing = await this.listingService.findOne(id, userId)
    return { success: true, data: listing }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing (DRAFT only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 403, description: 'Cannot edit non-draft listings' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser('sub') userId: string,
  ) {
    const listing = await this.listingService.update(id, dto, userId)
    return { success: true, data: listing }
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft listing → makes it ACTIVE' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Listing is now ACTIVE' })
  @ApiResponse({ status: 400, description: 'Validation error (end date, status)' })
  async publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const listing = await this.listingService.publish(id, userId)
    return { success: true, data: listing }
  }

  @Post(':id/images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add images to a listing (max 10 total)' })
  @ApiParam({ name: 'id', type: 'string' })
  async addImages(
    @Param('id') id: string,
    @Body('imageUrls') imageUrls: string[],
    @CurrentUser('sub') userId: string,
  ) {
    const result = await this.listingService.addImages(id, userId, imageUrls)
    return { success: true, data: result }
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an image from a listing' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiParam({ name: 'imageId', type: 'string' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const result = await this.listingService.removeImage(id, imageId, userId)
    return { success: true, ...result }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft/pending listing' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Listing deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete active/ended listings' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.listingService.remove(id, userId)
    return { success: true, ...result }
  }
}
