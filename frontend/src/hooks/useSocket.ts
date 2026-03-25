import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch } from './useAppDispatch'
import { prependMention } from '@/store/slices/mentionSlice'
import { incrementNewMentions } from '@/store/slices/projectSlice'

export function useSocket(projectId: string | null) {
  const dispatch = useAppDispatch()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!projectId) return

    const token = localStorage.getItem('token')
    const socket = io('/', {
      auth: { token },
      query: { projectId },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_project', projectId)
    })

    socket.on('new_mention', (mention) => {
      dispatch(prependMention(mention))
      dispatch(incrementNewMentions({ projectId, count: 1 }))
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
    })

    return () => {
      socket.emit('leave_project', projectId)
      socket.disconnect()
      socketRef.current = null
    }
  }, [projectId, dispatch])

  return socketRef.current
}
