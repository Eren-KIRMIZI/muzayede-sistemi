import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class FilterListingDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional({ enum: ['DRAFT', 'PENDING', 'ACTIVE', 'ENDED', 'SOLD', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING', 'ACTIVE', 'ENDED', 'SOLD', 'CANCELLED'])
  status?: string

  @ApiPropertyOptional({ enum: ['createdAt', 'startingPrice', 'endsAt', 'bidCount'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
