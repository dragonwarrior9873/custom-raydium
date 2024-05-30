import { shrinkToValue } from '@/functions/shrinkToValue'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { ReactNode, useState } from 'react'

/**
 * handle promise value
 */
export function AsyncAwait<T>(props: {
  /* for debug */
  forceDebugStatus?: 'pending' | 'rejected' | 'fullfilled'
  /** pending fallback*/
  fallback?: ReactNode | ((status: 'pending' | 'rejected' | 'fullfilled') => ReactNode)
  promise: T
  children?: (solvedValue: Awaited<T>) => ReactNode
  onFullfilled?(solvedValue: Awaited<T>): void
  onReject?(): void
}): JSX.Element {
  const [promiseStatus, setStatus] = useState<'pending' | 'fullfilled' | 'rejected'>(
    props.forceDebugStatus ?? 'pending'
  )
  // TODO: what if promise solved is null?🤔
  const [innerValue, setInnerValue] = useState<Awaited<T> | null>(null)
  useIsomorphicLayoutEffect(() => {
    const p = Promise.resolve(props.promise)
    p.then(
      (solvedValue) => {
        if (!props.forceDebugStatus) setStatus('fullfilled')
        props.onFullfilled?.(solvedValue)
        return solvedValue
      },
      (err) => {
        if (!props.forceDebugStatus) setStatus('rejected')
        props.onReject?.()
        return Promise.reject(err)
      }
    ).then((value) => {
      setInnerValue(value)
    })
  }, [props.promise])
  return (
    <>
      {promiseStatus === 'pending' || !innerValue
        ? shrinkToValue(props.fallback, [promiseStatus])
        : props.children?.(innerValue)}
    </>
  )
}
