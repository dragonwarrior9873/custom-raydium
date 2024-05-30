import {
  Clmm,
  ApiClmmPositionLinePoint,
  InnerSimpleTransaction,
  ReturnTypeFetchMultiplePoolInfos
} from '@raydium-io/raydium-sdk'
import { PublicKey } from '@solana/web3.js'

import BN from 'bn.js'
import { create } from 'zustand'

import useConnection from '@/application/connection/useConnection'
import useToken from '@/application/token/useToken'
import { shakeUndifindedItem } from '@/functions/arrayMethods'
import jFetch from '@/functions/dom/jFetch'
import useLocalStorageItem from '@/hooks/useLocalStorage'
import { SortMode, SortModeArr } from '@/hooks/useSort'
import { Numberish } from '@/types/constants'
import { MayArray } from '@/types/generics'

import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import { SplToken } from '../token/type'

import {
  APIConcentratedInfo,
  HydratedClmmConfigInfo,
  HydratedConcentratedInfo,
  SDKParsedConcentratedInfo,
  UICLMMRewardInfo,
  UserPositionAccount
} from './type'

export enum PoolsConcentratedTabs {
  ALL = 'All',
  STABLES = 'Stables',
  EXOTIC = 'Exotic',
  MY_POOLS = 'My Pools'
}

export enum PoolsConcentratedLayout {
  LIST = 'List',
  CARD = 'Card'
}

export enum TimeBasis {
  DAY = '24H',
  WEEK = '7D',
  MONTH = '30D'
}

export const timeMap = {
  [TimeBasis.DAY]: 'day',
  [TimeBasis.WEEK]: 'week',
  [TimeBasis.MONTH]: 'month'
}

interface FilterType {
  label: string
  min?: string
  max?: string
}

export type ConcentratedStore = {
  //#region ------------------- input data -------------------
  selectableAmmPools?: HydratedConcentratedInfo[]
  currentAmmPool?: HydratedConcentratedInfo
  /** user need manually select one */
  chartPoints?: ApiClmmPositionLinePoint[]
  lazyLoadChart: boolean
  loadChartPointsAct: (poolId: string, options?: { force?: boolean }) => void
  liquidity?: BN // from SDK, just store in UI
  liquidityMin?: BN // from SDK, just store in UI

  coin1?: SplToken
  coin1Amount?: Numberish // for coin may be not selected yet, so it can't be TokenAmount
  coin1AmountFee?: Numberish
  coin1ExpirationTime?: number
  coin1AmountMin?: Numberish // decrease liquidity
  coin1SlippageAmount?: Numberish // if coinSlippageAmount is empty (like user input is coin1Amount, so can only calculate coin2SlippageAmount), then use coinAmount as coinSlippageAmount

  coin2?: SplToken
  coin2Amount?: Numberish // for coin may be not selected yet, so it can't be TokenAmount
  coin2AmountFee?: Numberish
  coin2ExpirationTime?: number
  coin2AmountMin?: Numberish // decrease liquidity
  coin2SlippageAmount?: Numberish // if coinSlippageAmount is empty (like user input is coin1Amount, so can only calculate coin2SlippageAmount), then use coinAmount as coinSlippageAmount

  /** a create new clmm pool option */
  ammPoolStartTime?: Date

  priceUpperTick?: number // from SDK, just store in UI
  priceLowerTick?: number // from SDK, just store in UI

  focusSide: 'coin1' | 'coin2' // tansaction base side
  userCursorSide: 'coin1' | 'coin2' // some calculate may only whether compare  whether userCursorSide's amount have changed

  priceLower?: Numberish
  priceUpper?: Numberish
  totalDeposit?: Numberish
  //#endregion

  apiAmmPools: APIConcentratedInfo[]
  sdkParsedAmmPools: SDKParsedConcentratedInfo[]
  originSdkParsedAmmPools: ReturnTypeFetchMultiplePoolInfos
  hydratedAmmPools: HydratedConcentratedInfo[]

  isInput: boolean | undefined
  isRemoveDialogOpen: boolean
  isAddDialogOpen: boolean
  isMyPositionDialogOpen: boolean
  isMigrateToClmmDialogOpen: boolean
  isAprCalcPanelShown: boolean
  ownedPoolOnly: boolean

  targetUserPositionAccount?: UserPositionAccount

  scrollToInputBox: () => void

  // just for trigger refresh
  refreshCount: number
  refreshConcentrated: () => void

  /** data for hydrate is loading  */
  loading: boolean
  currentTab: PoolsConcentratedTabs
  searchText: string
  expandedItemIds: Set<string>
  tvl?: string | number // /api.raydium.io/v2/main/info
  volume24h?: string | number // /api.raydium.io/v2/main/info
  timeBasis: TimeBasis
  aprCalcMode: 'D' | 'C'

  availableAmmConfigFeeOptions?: HydratedClmmConfigInfo[] // create pool
  userSelectedAmmConfigFeeOption?: HydratedClmmConfigInfo // create pool
  userSettedCurrentPrice?: Numberish // create pool
  tempDataCache?: InnerSimpleTransaction[]
  rewards: UICLMMRewardInfo[] // TEMP

  planAApr?: { feeApr: number; rewardsApr: number[]; apr: number }
  planBApr?: { feeApr: number; rewardsApr: number[]; apr: number }
  planCApr?: { feeApr: number; rewardsApr: number[]; apr: number }

  fetchWhitelistRewards: () => void
  whitelistRewards: PublicKey[]
  poolSortConfig?: {
    key: string
    mode?: SortMode
    sortModeQueue: SortModeArr
    sortCompare: MayArray<(T) => any>
  }
  filterTarget: 'none' | 'Liquidity' | 'Volume' | 'Fees' | 'Apr'
  filterMax?: string
  filterMin?: string

  filter: {
    liquidity: FilterType
    volume: FilterType
    fees: FilterType
    apr: FilterType
  }

  setFilter: (target: 'liquidity' | 'volume' | 'fees' | 'apr', option: 'min' | 'max', value: string) => void
  resetFilter: (target: 'liquidity' | 'volume' | 'fees' | 'apr') => void
}

//* FAQ: why no setJsonInfos, setSdkParsedInfos and setHydratedInfos? because they are not very necessary, just use zustand`set` and zustand`useConcentrated.setState()` is enough
export const useConcentrated = create<ConcentratedStore>((set, get) => ({
  apiAmmPools: [],
  sdkParsedAmmPools: [],
  originSdkParsedAmmPools: {},
  hydratedAmmPools: [],

  focusSide: 'coin1',
  userCursorSide: 'coin1',

  lazyLoadChart: false,
  isAddDialogOpen: false,
  isRemoveDialogOpen: false,
  isMyPositionDialogOpen: false,
  isMigrateToClmmDialogOpen: false,
  isAprCalcPanelShown: false,
  ownedPoolOnly: false,

  isInput: undefined,
  isSearchAmmDialogOpen: false,
  removeAmount: '',
  loadChartPointsAct: async (poolId: string, options?: { force?: boolean }) => {
    const clmmPositionLineUrl = useAppAdvancedSettings.getState().apiUrls.clmmPositionLine
    const chartResponse = await jFetch<{ data: ApiClmmPositionLinePoint[] }>(
      `${clmmPositionLineUrl.replace('<poolId>', poolId)}`,
      { cacheFreshTime: options?.force ? undefined : 60 * 1000 }
    )
    const currentAmmPool = get().currentAmmPool
    if (!chartResponse || poolId !== currentAmmPool?.idString) return
    set({ chartPoints: chartResponse.data })
  },
  scrollToInputBox: () => {},
  refreshCount: 1,
  refreshConcentrated: () => {
    set({
      refreshCount: get().refreshCount + 1
    })
  },
  loading: true,
  currentTab: PoolsConcentratedTabs.ALL,
  currentLayout: PoolsConcentratedLayout.LIST,
  searchText: '',
  expandedItemIds: new Set(),
  timeBasis: TimeBasis.DAY,
  aprCalcMode: 'D',

  rewards: [],

  planAApr: { feeApr: 0, rewardsApr: [], apr: 0 },
  planBApr: { feeApr: 0, rewardsApr: [], apr: 0 },
  planCApr: { feeApr: 0, rewardsApr: [], apr: 0 },

  fetchWhitelistRewards: () => {
    const connection = useConnection.getState().connection
    if (!connection || get().whitelistRewards.length > 0) return
    const { getToken } = useToken.getState()
    const { programIds } = useAppAdvancedSettings.getState()
    Clmm.getWhiteListMint({
      connection,
      programId: programIds.CLMM
    }).then((data) => {
      set({
        whitelistRewards: shakeUndifindedItem(data.map((pub) => getToken(pub))).map((token) => token.mint)
      })
    })
  },
  whitelistRewards: [],
  poolSortConfig: undefined,
  filterTarget: 'none',
  filter: {
    liquidity: {
      label: 'Liquidity'
    },
    volume: {
      label: 'Volume'
    },
    fees: {
      label: 'Fees'
    },
    apr: {
      label: 'Apr'
    }
  },
  setFilter: (target, option, value) => {
    set((s) => ({
      filter: { ...s.filter, [target]: { ...s.filter[target], [option]: value } }
    }))
  },
  resetFilter: (target) => {
    set((s) => ({
      filter: { ...s.filter, [target]: { ...s.filter[target], max: '', min: '' } }
    }))
  }
}))

export default useConcentrated

export const useConcentratedFavoriteIds = () =>
  useLocalStorageItem<string[], null>('FAVOURITE_CONCENTRATED_POOL_IDS', { emptyValue: null })
