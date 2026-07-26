import { IsString, IsEmail, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string

  @ApiProperty({ example: 'NewSecureP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'NewSecureP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  confirmPassword: string
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  refreshToken: string
}
