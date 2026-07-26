import { IsString, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Elektronik' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: 'elektronik' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string

  @ApiPropertyOptional({ example: 'Elektronik ürünler kategorisi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiPropertyOptional({ example: 'laptop' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string

  @ApiPropertyOptional({ example: '#667eea' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  accentColor?: string

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
