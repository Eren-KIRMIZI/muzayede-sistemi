import { Logger, Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'PORT',
  'NODE_ENV',
]

const RECOMMENDED_ENV_VARS = [
  'JWT_PRIVATE_KEY_PATH',
  'JWT_PUBLIC_KEY_PATH',
  'REDIS_URL',
  'CORS_ORIGIN',
]

@Injectable()
export class EnvValidator {
  private readonly logger = new Logger(EnvValidator.name)

  validate(): void {
    const nodeEnv = process.env.NODE_ENV || 'development'

    // Check required variables
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
    if (missing.length > 0) {
      this.logger.error(`Missing required environment variables: ${missing.join(', ')}`)
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    // Check recommended variables
    const missingRecommended = RECOMMENDED_ENV_VARS.filter((key) => !process.env[key])
    if (missingRecommended.length > 0) {
      this.logger.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`)
    }

    // Validate JWT key files exist
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH

    if (privateKeyPath && !fs.existsSync(path.resolve(privateKeyPath))) {
      this.logger.warn(`JWT private key not found at: ${privateKeyPath} (using fallback)`)
    }

    if (publicKeyPath && !fs.existsSync(path.resolve(publicKeyPath))) {
      this.logger.warn(`JWT public key not found at: ${publicKeyPath} (using fallback)`)
    }

    // Validate PORT is a number
    const port = parseInt(process.env.PORT || '3001', 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      this.logger.error(`Invalid PORT value: ${process.env.PORT}`)
      throw new Error(`Invalid PORT value: ${process.env.PORT}`)
    }

    // Production-specific checks
    if (nodeEnv === 'production') {
      const prodRequired = ['JWT_PRIVATE_KEY_PATH', 'JWT_PUBLIC_KEY_PATH', 'CORS_ORIGIN']
      const prodMissing = prodRequired.filter((key) => !process.env[key])
      if (prodMissing.length > 0) {
        this.logger.error(`Production requires: ${prodMissing.join(', ')}`)
        throw new Error(`Production requires: ${prodMissing.join(', ')}`)
      }

      // Warn about insecure defaults
      if (process.env.JWT_SECRET === 'dev-secret-key') {
        this.logger.error('JWT_SECRET is set to insecure default in production!')
        throw new Error('JWT_SECRET must be changed in production')
      }
    }

    this.logger.log('Environment validation passed')
  }
}
