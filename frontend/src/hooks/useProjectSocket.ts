import { useEffect, useRef } from 'react'
import Stomp from 'stompjs'

export function useProjectSocket(projectId: number | undefined, onRefresh: () => void) {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const clientRef = useRef<Stomp.Client | null>(null)

  useEffect(() => {
    if (!projectId) return
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const client = Stomp.client(`${protocol}://${window.location.host}/ws`)
    clientRef.current = client

    client.connect({}, () => {
      subscriptionRef.current = client.subscribe(`/topic/project/${projectId}`, () => onRefresh())
    }, (error: unknown) => {
      console.warn('[TeamFlow] WebSocket connect failed', error)
    })

    return () => {
      subscriptionRef.current?.unsubscribe()
      if (clientRef.current?.connected) {
        clientRef.current.disconnect(() => undefined)
      }
      subscriptionRef.current = null
      clientRef.current = null
    }
  }, [projectId, onRefresh])
}
