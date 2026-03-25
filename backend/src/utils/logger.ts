import winston from 'winston'
import { env } from '../config/env'

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let metaStr = ''
            if (Object.keys(meta).length) {
              try {
                metaStr = ' ' + JSON.stringify(meta, (_key, value) => {
                  if (value instanceof Error) return { message: value.message, stack: value.stack }
                  if (typeof value === 'object' && value !== null) {
                    // Drop circular/socket objects
                    if (value.constructor?.name === 'TLSSocket' || value.constructor?.name === 'Socket') return '[Socket]'
                    if (value.constructor?.name === 'HTTPParser') return '[HTTPParser]'
                  }
                  return value
                })
              } catch {
                metaStr = ' [unserializable meta]'
              }
            }
            return `${timestamp} [${level}]: ${message}${metaStr}`
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
})
