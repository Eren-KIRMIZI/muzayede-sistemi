import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PlaceBidDto {
  @ApiProperty({ example: 1025 })
  @IsNumber()
  @Min(0.01)
  amount: number

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxAmount?: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAutoBid?: boolean
}
