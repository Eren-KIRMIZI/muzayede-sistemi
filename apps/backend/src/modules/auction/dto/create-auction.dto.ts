import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAuctionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsString()
  categoryId: string

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0.01)
  startingPrice: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservePrice?: number

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.01)
  bidIncrement: number

  @ApiProperty()
  @IsDateString()
  endsAt: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipping?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  imageUrls?: string[]
}
