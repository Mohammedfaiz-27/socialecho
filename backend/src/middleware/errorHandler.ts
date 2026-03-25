import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `${req.method} ${req.path} not found` } })
}

export function globalErrorHandler(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error(`${req.method} ${req.path}`, { message: err.message, stack: err.stack })

  const status = err.status ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'
  const message = status < 500 ? err.message : 'Internal server error'

  res.status(status).json({ error: { code, message } })
}
