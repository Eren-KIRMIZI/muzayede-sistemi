import { IsString, IsOptional, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

class ShippingAddressDto {
  @ApiProperty({ example: 'Bağcılar Caddesi No:42' })
  @IsString()
  street: string

  @ApiProperty({ example: 'Istanbul' })
  @IsString()
  city: string

  @ApiPropertyOptional({ example: 'Istanbul' })
  @IsOptional()
  @IsString()
  state?: string

  @ApiProperty({ example: 'TR' })
  @IsString()
  country: string

  @ApiProperty({ example: '34100' })
  @IsString()
  postalCode: string
}

export class CreateOrderDto {
  @ApiProperty({ description: 'The auction this order is for' })
  @IsString()
  auctionId: string

  @ApiPropertyOptional({ description: 'Shipping address (if physical item)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED'] })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ example: '1Z999AA10123456784', description: 'Carrier tracking number' })
  @IsOptional()
  @IsString()
  trackingNumber?: string

  @ApiPropertyOptional({ example: 'DHL', description: 'Shipping carrier name' })
  @IsOptional()
  @IsString()
  carrier?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerNote?: string
}
