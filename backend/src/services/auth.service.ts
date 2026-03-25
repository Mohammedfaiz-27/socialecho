import bcrypt from 'bcryptjs'
import { User } from '../models/postgres/User'
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { cache } from '../config/redis'

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await User.findOne({ where: { email } })
    if (existing) throw Object.assign(new Error('Email already in use'), { status: 409, code: 'EMAIL_EXISTS' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })

    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role })

    return { user: sanitize(user), token, refreshToken }
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } })
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' })

    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role })

    return { user: sanitize(user), token, refreshToken }
  },

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token)

    const isBlacklisted = await cache.get(`blacklist:${token}`)
    if (isBlacklisted) throw Object.assign(new Error('Token revoked'), { status: 401, code: 'TOKEN_REVOKED' })

    const newToken = signToken({ userId: payload.userId, email: payload.email, role: payload.role })
    return { token: newToken }
  },

  async getCurrentUser(userId: string) {
    const user = await User.findByPk(userId)
    if (!user) throw Object.assign(new Error('User not found'), { status: 404, code: 'NOT_FOUND' })
    return sanitize(user)
  },
}

function sanitize(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    createdAt: user.createdAt,
  }
}
