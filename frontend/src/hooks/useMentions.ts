import { useEffect, useCallback } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { useAppSelector } from './useAppSelector'
import { fetchMentions } from '@/store/slices/mentionSlice'

export function useMentions(projectId: string) {
  const dispatch = useAppDispatch()
  const { mentions, isLoading, error, totalCount, totalPages, page, pageSize } = useAppSelector(
    (s) => s.mentions
  )
  const filters = useAppSelector((s) => s.filters.active)

  const load = useCallback(() => {
    dispatch(fetchMentions({ projectId, filters, page, pageSize }))
  }, [dispatch, projectId, filters, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  return { mentions, isLoading, error, totalCount, totalPages, page, pageSize, reload: load }
}
