import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { login, clearError } from '@/store/slices/authSlice'
import type { LoginCredentials } from '@/types'
import axios from 'axios'

async function pingBackend(): Promise<boolean> {
  try {
    await axios.get('/api/v1/health', { timeout: 60000 })
    return true
  } catch {
    return false
  }
}

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth)
  const [serverStatus, setServerStatus] = useState<'checking' | 'ready' | 'waking'>('checking')
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginCredentials>()

  // Ping backend on mount to trigger wake-up
  useEffect(() => {
    let cancelled = false
    async function check() {
      const ok = await pingBackend()
      if (cancelled) return
      if (ok) {
        setServerStatus('ready')
      } else {
        setServerStatus('waking')
        // retry ping every 5s until alive
        retryRef.current = setTimeout(check, 5000)
      }
    }
    check()
    return () => {
      cancelled = true
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) navigate('/projects', { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, navigate, dispatch])

  // Auto-retry login once server is ready after it was waking
  const prevStatus = useRef(serverStatus)
  useEffect(() => {
    if (prevStatus.current === 'waking' && serverStatus === 'ready') {
      const values = getValues()
      if (values.email && values.password) {
        dispatch(login(values))
      }
    }
    prevStatus.current = serverStatus
  }, [serverStatus, dispatch, getValues])

  async function onSubmit(data: LoginCredentials) {
    if (serverStatus === 'waking') return // wait for server to wake
    dispatch(login(data))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">SR</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to Smart Radar</p>
        </div>

        {/* Server waking up banner */}
        {serverStatus !== 'ready' && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {serverStatus === 'checking'
              ? 'Connecting to server…'
              : 'Server is starting up, please wait (up to 60s)…'}
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
              })}
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || serverStatus !== 'ready'}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {serverStatus === 'waking'
              ? 'Waiting for server…'
              : serverStatus === 'checking'
              ? 'Connecting…'
              : isLoading
              ? 'Signing in…'
              : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
