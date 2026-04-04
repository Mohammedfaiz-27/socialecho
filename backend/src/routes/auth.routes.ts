import { Router } from 'express'
import Joi from 'joi'
import { authService } from '../services/auth.service'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
import { success, error } from '../utils/response'
import type { AuthRequest } from '../types'

const router = Router()

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body.name, req.body.email, req.body.password)
    success(res, result, 201)
  } catch (err) {
    next(err)
  }
})

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { error(res, 'Refresh token required', 'VALIDATION_ERROR'); return }
    const result = await authService.refreshToken(refreshToken)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId)
    success(res, user)
  } catch (err) {
    next(err)
  }
})

router.post('/logout', authenticate, (_req, res) => {
  success(res, { message: 'Logged out successfully' })
})

export default router
