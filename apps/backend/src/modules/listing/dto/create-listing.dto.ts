import { IsString, IsNumber, IsOptional, IsDateString, Min, MaxLength, IsArray, IsUrl } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateListingDto {
  @ApiProperty({ example: 'Vintage Rolex Watch', description: 'Listing title' })
  @IsString()
  @MaxLength(200)
  title: string

  @ApiProperty({ example: 'A beautiful 1970s Rolex Submariner in excellent condition.' })
  @IsString()
  description: string

  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  categoryId: string

  @ApiProperty({ example: 500, description: 'Starting bid price in USD' })
  @IsNumber()
  @Min(0.01)
  startingPrice: number

  @ApiPropertyOptional({ example: 800, description: 'Minimum acceptable price (hidden from bidders)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservePrice?: number

  @ApiPropertyOptional({ example: 25, description: 'Minimum bid increment amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  bidIncrement?: number

  @ApiProperty({ example: '2026-08-01T18:00:00.000Z', description: 'Auction end date/time (ISO 8601)' })
  @IsDateString()
  endsAt: string

  @ApiPropertyOptional({ example: 'Istanbul, Turkey' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string

  @ApiPropertyOptional({ example: 'Ships worldwide via DHL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipping?: string

  @ApiPropertyOptional({ type: [String], description: 'Array of image URLs' })
  @IsOptional()
  @IsArray()
  imageUrls?: string[]
}
