import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useFirestoreSubscription<T>(
  queryKey: unknown[],
  subscribe: (onData: (data: T) => void) => () => void,
  enabled = true,
) {
  const queryClient = useQueryClient()
  const key = JSON.stringify(queryKey)

  useEffect(() => {
    if (!enabled) return
    const unsub = subscribe((data) => {
      queryClient.setQueryData(queryKey, data)
    })
    return unsub
    // queryKey identity is captured via `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, enabled, key])
}
