import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../types'
import { verifyToken } from '../utils/jwt'
import { error } from '../utils/response'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    error(res, 'Missing or invalid authorization header', 'UNAUTHORIZED', 401)
    return
  }
  const token = header.slice(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    error(res, 'Invalid or expired token', 'UNAUTHORIZED', 401)
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      error(res, 'Insufficient permissions', 'FORBIDDEN', 403)
      return
    }
    next()
  }
}
