import { useRouter } from 'next/router'

import { ApiPoolInfo, ApiPoolInfoItem } from '@raydium-io/raydium-sdk'

import useConnection from '@/application/connection/useConnection'
import useToken from '@/application/token/useToken'
import useWallet from '@/application/wallet/useWallet'
import { shakeUndifindedItem } from '@/functions/arrayMethods'
import jFetch from '@/functions/dom/jFetch'
import toPubString from '@/functions/format/toMintString'
import { areShallowEqual } from '@/functions/judgers/areEqual'
import { gt } from '@/functions/numberish/compare'
import { useRecordedEffect } from '@/hooks/useRecordedEffect'
import { useTransitionedEffect } from '@/hooks/useTransitionedEffect'

import { getUserTokenEvenNotExist } from '../token/getUserTokenEvenNotExist'

import hydrateLiquidityInfo from './hydrateLiquidityInfo'
import sdkParseJsonLiquidityInfo from './sdkParseJsonLiquidityInfo'
import useLiquidity from './useLiquidity'
import useAppAdvancedSettings from '../common/useAppAdvancedSettings'

export const parseAndSetPoolList = (response?: ApiPoolInfo, fetchTime?: number) => {
  // const blacklist = await jFetch<HexAddress[]>('/amm-blacklist.json')
  const liquidityInfoList = [...(response?.official ?? []), ...(response?.unOfficial ?? [])]
  // no raydium blacklist amm
  // .filter((info) => !(blacklist ?? []).includes(info.id))
  const officialIds = new Set(response?.official?.map((i) => i.id))
  const unOfficialIds = new Set(response?.unOfficial?.map((i) => i.id))

  const extraPoolInfos = useLiquidity.getState().extraPooInfos
  const readyMergePools = extraPoolInfos.filter((p) => !officialIds.has(p.id) && !unOfficialIds.has(p.id))
  liquidityInfoList.push(...readyMergePools)
  readyMergePools.forEach((p) => unOfficialIds.add(p.id))

  if (liquidityInfoList)
    useLiquidity.setState({
      ...(response ? { apiCacheInfo: { fetchTime: fetchTime || Date.now(), data: response } } : {}),
      jsonInfos: liquidityInfoList,
      officialIds,
      unOfficialIds
    })
}

export const fetchUpdatePoolInfo = async () => {
  const now = new Date()
  const checkPrefix = (val: number) => (val < 10 ? `0${val}` : val.toString())
  const [year, month, day] = [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()]
  const dailyPoolInfo = useAppAdvancedSettings.getState().apiUrls.dailyPoolInfo
  const response = await jFetch<ApiPoolInfo>(dailyPoolInfo + `/${year}-${checkPrefix(month)}-${checkPrefix(day)}`)
  const data: Map<string, ApiPoolInfoItem> = new Map()
  response?.official.forEach((pool) => {
    data.set(pool.id, pool)
  })
  response?.unOfficial.forEach((pool) => {
    data.set(pool.id, pool)
  })
  return data
}

/**
 * will load liquidity info (jsonInfo, sdkParsedInfo, hydratedInfo)
 */
export default function useLiquidityInfoLoader({ disabled }: { disabled?: boolean } = {}) {
  const {
    jsonInfos,
    sdkParsedInfos,
    currentJsonInfo,
    currentSdkParsedInfo,
    userExhibitionLiquidityIds,
    hydratedInfos
  } = useLiquidity()
  const getToken = useToken((s) => s.getToken)
  const getLpToken = useToken((s) => s.getLpToken)
  const isLpToken = useToken((s) => s.isLpToken)
  const refreshCount = useLiquidity((s) => s.refreshCount)
  const connection = useConnection((s) => s.connection)
  const pureRawBalances = useWallet((s) => s.pureRawBalances)
  const { pathname } = useRouter()
  const isLiquidityPage = pathname === '/liquidity/add'
  const poolInfoUrl = useAppAdvancedSettings((s) => s.apiUrls.uiPoolInfo)

  /** fetch json info list  */
  useTransitionedEffect(async () => {
    if (disabled) return
    const response = await jFetch<ApiPoolInfo>(poolInfoUrl, {
      cacheFreshTime: 1000 * 30
    })
    parseAndSetPoolList(response)
  }, [disabled, poolInfoUrl])

  /** get userExhibitionLiquidityIds */
  useTransitionedEffect(async () => {
    // when refresh, it will refresh twice. one for rawBalance, one for liquidityRefreshCount
    if (disabled) return
    if (!isLiquidityPage) return
    if (!jsonInfos) return
    const liquidityLpMints = new Set(jsonInfos.map((jsonInfo) => jsonInfo.lpMint))
    const allLpBalance = Object.entries(pureRawBalances).filter(
      ([mint, tokenAmount]) => liquidityLpMints.has(mint) && gt(tokenAmount, 0)
    )
    const allLpBalanceMint = allLpBalance.map(([mint]) => mint)
    const userExhibitionLiquidityIds = jsonInfos
      .filter((jsonInfo) => allLpBalanceMint.includes(jsonInfo.lpMint))
      .map((jsonInfo) => jsonInfo.id)

    useLiquidity.setState({ userExhibitionLiquidityIds })
  }, [disabled, isLiquidityPage, jsonInfos, pureRawBalances, isLpToken, refreshCount])

  /** json infos ➡ sdkParsed infos (only wallet's LP)  */
  useRecordedEffect(
    async ([, , , prevUserExhibitionLiquidityIds, prevRefreshCount]) => {
      if (disabled) return
      if (!connection || !jsonInfos.length || !userExhibitionLiquidityIds.length) return
      if (
        prevRefreshCount == refreshCount &&
        areShallowEqual(prevUserExhibitionLiquidityIds, userExhibitionLiquidityIds)
      )
        return

      const sdkParsedInfos = await sdkParseJsonLiquidityInfo(
        jsonInfos.filter((i) => userExhibitionLiquidityIds.includes(i.id)),
        connection
      )
      useLiquidity.setState({ sdkParsedInfos: shakeUndifindedItem(sdkParsedInfos) })
    },
    [disabled, connection, jsonInfos, userExhibitionLiquidityIds, refreshCount] as const
  )

  /** sdkParsed infos (only wallet's LP) ➡  hydrated infos (only wallet's LP)*/
  useTransitionedEffect(async () => {
    if (disabled) return
    const hydratedInfos = sdkParsedInfos.map((liquidityInfo) =>
      hydrateLiquidityInfo(liquidityInfo, {
        getToken,
        getLpToken,
        lpBalance: pureRawBalances[toPubString(liquidityInfo.lpMint)]
      })
    )
    useLiquidity.setState({ hydratedInfos })
  }, [disabled, sdkParsedInfos, pureRawBalances, getToken, getLpToken])

  // record id to userAddedTokens
  useRecordedEffect(
    ([prevHydratedInfos]) => {
      const areHydratedIdsNotChanged =
        prevHydratedInfos &&
        areShallowEqual(
          prevHydratedInfos?.map((i) => toPubString(i.id)),
          hydratedInfos.map((i) => toPubString(i.id))
        )
      if (areHydratedIdsNotChanged) return
      const recordedHydratedInfos = hydratedInfos.map((i) => {
        getUserTokenEvenNotExist(i.baseMint)
        getUserTokenEvenNotExist(i.quoteMint)
        return hydrateLiquidityInfo(i.sdkInfo, {
          getToken,
          getLpToken,
          lpBalance: pureRawBalances[toPubString(i.lpMint)]
        })
      })
      useLiquidity.setState({ hydratedInfos: recordedHydratedInfos })
    },
    [hydratedInfos]
  )

  /** CURRENT jsonInfo ➡ current sdkParsedInfo  */
  useTransitionedEffect(async () => {
    if (disabled) return
    if (connection && currentJsonInfo) {
      const determainedResult = (await sdkParseJsonLiquidityInfo([currentJsonInfo], connection))?.[0]
      useLiquidity.setState({
        currentSdkParsedInfo: determainedResult
      })
    } else {
      useLiquidity.setState({ currentSdkParsedInfo: undefined })
    }
  }, [disabled, currentJsonInfo, connection, refreshCount])

  /** CURRENT sdkParsedInfo ➡ current hydratedInfo  */
  useTransitionedEffect(async () => {
    if (disabled) return
    if (connection && currentSdkParsedInfo) {
      const lpBalance = pureRawBalances[String(currentSdkParsedInfo.lpMint)]
      const hydrated = await hydrateLiquidityInfo(currentSdkParsedInfo, { getToken, getLpToken, lpBalance })
      useLiquidity.setState({
        currentHydratedInfo: hydrated
      })
    } else {
      useLiquidity.setState({ currentHydratedInfo: undefined })
    }
  }, [disabled, currentSdkParsedInfo, getToken, getLpToken])
}
