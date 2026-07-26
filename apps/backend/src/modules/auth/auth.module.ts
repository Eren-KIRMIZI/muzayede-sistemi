import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GoogleStrategy } from './strategies/google.strategy'

function loadPrivateKey(config: ConfigService): string | Buffer {
  const keyPath = config.get('JWT_PRIVATE_KEY_PATH', './certs/jwt-private.pem')
  try {
    return fs.readFileSync(path.resolve(keyPath), 'utf-8')
  } catch {
    const fallback = config.get('JWT_SECRET', 'dev-secret-key-change-in-production')
    return fallback
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        privateKey: loadPrivateKey(config),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.get('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
          issuer: 'auction-platform',
          audience: 'auction-api',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
