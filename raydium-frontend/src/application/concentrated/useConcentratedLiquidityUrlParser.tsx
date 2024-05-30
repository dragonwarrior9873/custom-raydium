import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import { ParsedUrlQuery } from 'querystring'

import useAppSettings from '@/application/common/useAppSettings'
import useNotification from '@/application/notification/useNotification'
import useToken from '@/application/token/useToken'
import { throttle } from '@/functions/debounce'
import { areShallowEqual } from '@/functions/judgers/areEqual'
import { objectShakeFalsy } from '@/functions/objectMethods'
import useAsyncEffect from '@/hooks/useAsyncEffect'
import { useRecordedEffect } from '@/hooks/useRecordedEffect'

import useConnection from '../connection/useConnection'

import { isHydratedConcentratedItemInfo } from './is'
import useConcentrated from './useConcentrated'
import { RAYMint, USDCMint } from '../token/wellknownToken.config'

export default function useConcentratedLiquidityUrlParser() {
  const { query, pathname, replace } = useRouter()
  const hydratedAmmPools = useConcentrated((s) => s.hydratedAmmPools)
  const currentAmmPool = useConcentrated((s) => s.currentAmmPool)

  const connection = useConnection((s) => s.connection)
  const getToken = useToken((s) => s.getToken)
  const inCleanUrlMode = useAppSettings((s) => s.inCleanUrlMode)

  // flag: 'get info from url' period  or  'affect info to url' period
  const [haveInit, setHaveInit] = useState(false)

  const findPoolInfoByAmmId = useCallback(
    (ammid: string) => hydratedAmmPools.find((pool) => pool.idString === ammid),
    [hydratedAmmPools]
  )

  useEffect(() => {
    // when not /clmm/create-position page, reset flag
    if (!pathname.includes('/clmm/create-position')) {
      setHaveInit(false)
    }
  }, [pathname])

  useEffect(() => {
    // when refresh window, reset flag
    const unload = () => setHaveInit(false)
    globalThis?.addEventListener('beforeunload', unload)
    return () => globalThis?.removeEventListener('beforeunload', unload)
  }, [])

  // From url
  useAsyncEffect(async () => {
    // only get data from url when /liquidity page is route from other page
    if (!pathname.includes('/clmm/create-position')) return
    if (!connection) return // parse must relay on connection
    // not in 'from url' period
    if (haveInit) return

    const { logWarning } = useNotification.getState()

    const { ammId: urlAmmId } = getConcentratedLiquidityInfoFromQuery(query)

    if (urlAmmId && hydratedAmmPools.length > 0) {
      // from URL: according to user's ammId (or coin1 & coin2) , match liquidity pool json info
      const matchedLiquidityInfo = urlAmmId ? findPoolInfoByAmmId(urlAmmId) : undefined

      const isHydratedInfo = isHydratedConcentratedItemInfo(matchedLiquidityInfo)

      // sync to zustand store

      if (matchedLiquidityInfo && isHydratedInfo) {
        useConcentrated.setState({
          currentAmmPool: matchedLiquidityInfo,
          coin1: matchedLiquidityInfo.base,
          coin2: matchedLiquidityInfo.quote
        })
      } else {
        useConcentrated.setState({
          coin1: getToken(RAYMint),
          coin2: getToken(USDCMint)
        })
        // may be just haven't load liquidityPoolJsonInfos yet
        if (hydratedAmmPools.length > 0) logWarning(`Pool not found. Check the URL link or search manually.`)
      }
    }

    // if not load enough data(no liquidity pools or no tokens), do not change flag
    if (hydratedAmmPools.length > 0) {
      setHaveInit(true)
    }
  }, [haveInit, connection, pathname, query, hydratedAmmPools, findPoolInfoByAmmId])

  //#region ------------------- sync zustand data to url -------------------
  const throttledUpdateUrl = useCallback(
    throttle(
      (pathname: string, query: Record<string, any>) => {
        replace({ pathname, query }, undefined, { shallow: true })
      },
      { delay: 500 }
    ),
    [replace]
  )
  useRecordedEffect(() => {
    if (!pathname.includes('/clmm/create-position')) return

    // not in 'from url' period
    if (!haveInit) return

    // no need to affact change to url if it's  clean-url-mode
    if (inCleanUrlMode) return

    const urlInfo = getConcentratedLiquidityInfoFromQuery(query)

    // attach state to url
    const dataInfo = objectShakeFalsy({
      ammId: currentAmmPool?.idString
    })

    const urlNeedUpdate = !areShallowEqual(urlInfo, dataInfo)
    if (urlNeedUpdate) throttledUpdateUrl(pathname, dataInfo)
  }, [haveInit, inCleanUrlMode, currentAmmPool, query, pathname])
  //#endregion
}

function getConcentratedLiquidityInfoFromQuery(query: ParsedUrlQuery): {
  ammId: string
} {
  const rawObj = {
    ammId: String(query.ammId ?? query.ammid ?? '')
  }

  return objectShakeFalsy(rawObj)
}
