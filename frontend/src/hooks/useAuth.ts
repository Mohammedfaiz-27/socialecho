import { useEffect } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { useAppSelector } from './useAppSelector'
import { fetchCurrentUser, logout } from '@/store/slices/authSlice'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error, token } = useAppSelector((s) => s.auth)

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [token, user, dispatch])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout: () => dispatch(logout()),
  }
}
