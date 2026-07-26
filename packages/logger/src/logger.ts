import * as winston from 'winston'

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'verbose'

export interface LogContext {
  service?: string
  requestId?: string
  userId?: string
  [key: string]: unknown
}

const { combine, timestamp, printf, colorize, json, errors } = winston.format

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, service, requestId, ...meta }) => {
    const ctx = [service && `[${service}]`, requestId && `rid:${requestId}`]
      .filter(Boolean)
      .join(' ')
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${ts} ${level} ${ctx} ${message}${metaStr}`
  }),
)

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
)

export function createLogger(service: string, level: LogLevel = 'info') {
  const isProduction = process.env.NODE_ENV === 'production'

  return winston.createLogger({
    level,
    defaultMeta: { service },
    format: isProduction ? prodFormat : devFormat,
    transports: [
      new winston.transports.Console(),
      ...(isProduction
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              maxsize: 10 * 1024 * 1024, // 10MB
              maxFiles: 5,
              tailable: true,
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              maxsize: 10 * 1024 * 1024,
              maxFiles: 10,
              tailable: true,
            }),
          ]
        : []),
    ],
  })
}

export type AppLogger = ReturnType<typeof createLogger>
