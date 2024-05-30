import useNotification from '@/application/notification/useNotification'
import { MayPromise } from '@/types/constants'

import assert from '../assert'
import { isString } from '../judgers/dateType'

// TODO: feture: use standard server-worker instead. see (https://developers.google.com/web/fundamentals/primers/service-workers)
type ResourceUrl = string
type TryFetchOptions = RequestInit & {
  /** this will ignore cache. force to send request. the result will refresh the  */
  ignoreCache?: boolean
  /** if cache is fresh, use cache. default 1000ms */
  cacheFreshTime?: number
}
type JFetchOptions = {
  /** usually it's for data rename  */
  beforeJson?: (data: any) => MayPromise<any>
  /** usually it's for data reshape  */
  afterJson?: (data: any) => MayPromise<any>
} & TryFetchOptions

// TODO: should have concept of out of date
const resultCache = new Map<ResourceUrl, { rawText: Promise<string | undefined>; reponseTime?: number }>()

/**
 * same interface as original fetch, but, customized version have cache
 */
export default async function jFetch<Shape = any>(
  input: RequestInfo,
  options?: JFetchOptions
): Promise<Shape | undefined> {
  const rawText = await tryFetch(input, options)
  if (!rawText) return undefined

  const renamedText = await (options?.beforeJson?.(rawText) ?? rawText)
  if (!renamedText) return undefined
  try {
    const rawJson = JSON.parse(renamedText || '{}')
    const formattedData = await (options?.afterJson?.(rawJson) ?? rawJson)
    return formattedData
  } catch (e) {
    return undefined
  }
}

const maxCostTime = 2 * 1000

// 💩
function onCostLongerThanMaxTime(key: string) {
  if (!key.includes('uapi.raydium.io')) return
  console.error(`fetch ${key} cost too much time(>${maxCostTime}ms)`)
  // if (isInBonsaiTest || isInLocalhost) { // too noisy
  //   const { logError } = useNotification.getState()
  //   logError(`fetch cost too much`, `${key} cost too much time(>${maxCostTime}ms)`)
  // }
}

function onFetchError(key: string, response: Response) {
  if (!key.includes('uapi.raydium.io')) return
  const { logError } = useNotification.getState()
  if (response.status === 429) {
    logError(`HTTP error 429`, 'Too many requests.')
  }
}

/**
 * the same interface as original fetch, but, has cache
 */
// TODO: unexceptedly cache useless all response, even ignoreCache
export async function tryFetch(input: RequestInfo, options?: TryFetchOptions): Promise<string | undefined> {
  const key = (typeof input === 'string' ? input : input.url) + (options?.body?.toString() ?? '')
  const notRequestFinishedYet = resultCache.has(key) && !resultCache.get(key)!.reponseTime
  const requestIsTooFrequent =
    resultCache.has(key) && resultCache.get(key)!.reponseTime && Date.now() - resultCache.get(key)!.reponseTime! < 2000
  const shouldUseCache = requestIsTooFrequent || notRequestFinishedYet
  if (shouldUseCache) return resultCache.get(key)!.rawText

  try {
    const canUseCache =
      resultCache.has(key) &&
      !options?.ignoreCache &&
      (options?.cacheFreshTime
        ? resultCache.get(key)?.reponseTime &&
          Date.now() - resultCache.get(key)!.reponseTime! < (options.cacheFreshTime ?? 2000)
        : false)
    if (!canUseCache) {
      // log fetch info
      const timoutId = setTimeout(() => onCostLongerThanMaxTime(key), maxCostTime)

      // fetch  core
      const response = (
        key.includes('uapi.raydium.io')
          ? fetch(input, { ...options, headers: options?.headers })
          : fetch(input, options)
      )
        // add version for debug
        .finally(() => {
          clearTimeout(timoutId)
        })

      resultCache.set(key, {
        rawText: response
          .then((r) => {
            if (r.ok) return r.clone()
            else {
              onFetchError(key, r.clone())
              throw new Error('not ok')
            }
          })
          .then((r) => r.text())
          .catch(() => undefined)
          .finally(() => {
            if (resultCache.has(key)) {
              resultCache.get(key)!.reponseTime = Date.now()
            }
          })
          .catch(() => undefined)
      })

      const rawText = await response
        .then((r) => r.text())
        .catch((e) => {
          console.error(e)
          return undefined
        })
      assert(isString(rawText))
      return rawText
    } else {
      return resultCache.get(key)?.rawText
    }
  } catch (e) {
    resultCache.set(key, { rawText: Promise.resolve(undefined), reponseTime: Date.now() })
    return Promise.resolve(undefined)
  }
}
