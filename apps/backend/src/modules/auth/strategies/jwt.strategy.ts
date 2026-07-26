import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import * as fs from 'fs'
import * as path from 'path'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  sessionId: string
  iat: number
  exp: number
  iss: string
  aud: string
  jti: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './certs/jwt-public.pem'
    let publicKey: string

    try {
      publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf-8')
    } catch {
      // Fallback to secret for development
      publicKey = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
      issuer: 'auction-platform',
      audience: 'auction-api',
    })
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token')
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
      jti: payload.jti,
    }
  }
}
