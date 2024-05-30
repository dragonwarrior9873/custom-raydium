import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { twMerge } from 'tailwind-merge'

import useAppSettings from '@/application/common/useAppSettings'
import { usePoolTimeBasisLoader } from '@/application/common/usePoolTimeBasisLoader'
import { TimeBasis } from '@/application/concentrated/useConcentrated'
import useFarms from '@/application/farms/useFarms'
import { isHydratedPoolItemInfo } from '@/application/pools/is'
import { HydratedPairItemInfo, JsonPairItemInfo } from '@/application/pools/type'
import usePoolSummeryInfoLoader from '@/application/pools/usePoolSummeryInfoLoader'
import { usePoolFavoriteIds, usePools } from '@/application/pools/usePools'
import { routeTo } from '@/application/routeTools'
import { SplToken } from '@/application/token/type'
import useToken from '@/application/token/useToken'
import useWallet from '@/application/wallet/useWallet'
import { AddressItem } from '@/components/AddressItem'
import AutoBox from '@/components/AutoBox'
import { Badge } from '@/components/Badge'
import Button from '@/components/Button'
import Card from '@/components/Card'
import CoinAvatar from '@/components/CoinAvatar'
import CoinAvatarPair from '@/components/CoinAvatarPair'
import Col from '@/components/Col'
import Collapse from '@/components/Collapse'
import CyberpunkStyleCard from '@/components/CyberpunkStyleCard'
import DecimalInput from '@/components/DecimalInput'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import Input from '@/components/Input'
import InputBox from '@/components/InputBox'
import List from '@/components/List'
import LoadingCircle from '@/components/LoadingCircle'
import { OpenBookTip } from '@/components/OpenBookTip'
import PageLayout from '@/components/PageLayout'
import Popover from '@/components/Popover'
import RefreshCircle from '@/components/RefreshCircle'
import ResponsiveDialogDrawer from '@/components/ResponsiveDialogDrawer'
import Row from '@/components/Row'
import Select from '@/components/Select'
import Switcher from '@/components/Switcher'
import Tooltip from '@/components/Tooltip'
import { addItem, removeItem } from '@/functions/arrayMethods'
import { capitalize } from '@/functions/changeCase'
import { formatApr } from '@/functions/format/formatApr'
import formatNumber from '@/functions/format/formatNumber'
import listToMap from '@/functions/format/listToMap'
import toPubString from '@/functions/format/toMintString'
import toPercentString from '@/functions/format/toPercentString'
import toTotalPrice from '@/functions/format/toTotalPrice'
import toUsdVolume from '@/functions/format/toUsdVolume'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { gt, gte, isMeaningfulNumber, lt, lte } from '@/functions/numberish/compare'
import toFraction from '@/functions/numberish/toFraction'
import { toString } from '@/functions/numberish/toString'
import { objectFilter, objectShakeFalsy } from '@/functions/objectMethods'
import { searchItems } from '@/functions/searchItems'
import { toggleSetItem } from '@/functions/setMethods'
import { useDebounce, useDebounceValue } from '@/hooks/useDebounce'
import useSort, { SimplifiedSortConfig, SortConfigItem } from '@/hooks/useSort'

/**
 * store:
 * {@link useCurrentPage `useCurrentPage`} ui page store
 * {@link usePools `usePools`} pools store
 * {@link useDatabase `useDatabase`} detail data is from liquidity
 */
export default function PoolsPage() {
  usePoolSummeryInfoLoader()
  usePoolTimeBasisLoader()

  return (
    <PageLayout contentButtonPaddingShorter mobileBarTitle="Pools" metaTitle="Pools - Raydium">
      <PoolHeader />
      <PoolCard />
    </PageLayout>
  )
}

function PoolHeader() {
  const tvl = usePools((s) => s.tvl)
  const volume24h = usePools((s) => s.volume24h)
  const showTvlVolume24h = Boolean(tvl != null && volume24h != null)
  const isMobile = useAppSettings((s) => s.isMobile)
  return isMobile ? (
    showTvlVolume24h ? (
      <Row className="mx-auto my-2 text-base mobile:text-xs justify-self-start self-end text-[#abc4ff80] gap-4">
        <div className="whitespace-nowrap">
          TVL: <span className="font-medium text-[#abc4ff]">${formatNumber(tvl)}</span>
        </div>
        <div className="whitespace-nowrap">
          Volume24H: <span className="font-medium text-[#abc4ff]">${formatNumber(volume24h)}</span>
        </div>
      </Row>
    ) : null
  ) : (
    <Grid className="grid-cols-[1fr,1fr] mobile:grid-cols-2 grid-flow-row-dense items-center gap-y-8 pb-8">
      <Row className="justify-self-start gap-8">
        <div className="text-2xl mobile:text-lg text-white font-semibold">Pools</div>
        {showTvlVolume24h && (
          <Row className="title text-base mobile:text-xs justify-self-start self-end text-[#abc4ff80] gap-4">
            <div className="whitespace-nowrap">
              TVL: <span className="font-medium text-[#abc4ff]">${formatNumber(tvl)}</span>
            </div>
            <div className="whitespace-nowrap">
              Volume24H: <span className="font-medium text-[#abc4ff]">${formatNumber(volume24h)}</span>
            </div>
          </Row>
        )}
      </Row>
      <Row
        className={`justify-self-end self-center gap-1 flex-wrap items-center opacity-100 pointer-events-auto clickable transition`}
        onClick={() => {
          routeTo('/liquidity/create')
        }}
      >
        <Icon heroIconName="plus-circle" className="text-[#abc4ff]" size="sm" />
        <span className="text-[#abc4ff] font-medium text-sm mobile:text-xs">Create Pool</span>
      </Row>
    </Grid>
  )
}

function PoolStakedOnlyBlock() {
  const onlySelfPools = usePools((s) => s.onlySelfPools)
  const connected = useWallet((s) => s.connected)
  if (!connected) return null
  return (
    <Row className="justify-self-end mobile:justify-self-auto items-center">
      <span className="text-[rgba(196,214,255,0.5)] font-medium text-sm mobile:text-xs whitespace-nowrap">
        My Liquidity
      </span>
      <Switcher
        className="ml-2"
        defaultChecked={onlySelfPools}
        onToggle={(isOnly) => {
          usePools.setState({ onlySelfPools: isOnly })
        }}
      />
    </Row>
  )
}

function ToolsButton({ className }: { className?: string }) {
  return (
    <>
      <Popover placement="bottom-right">
        <Popover.Button>
          <div className={twMerge('mx-1 rounded-full p-2 text-[#abc4ff] clickable justify-self-start', className)}>
            <Icon className="w-4 h-4" iconClassName="w-4 h-4" heroIconName="dots-vertical" />
          </div>
        </Popover.Button>
        <Popover.Panel>
          <div>
            <Card
              className="flex flex-col py-3 px-4  max-h-[80vh] border-1.5 border-[rgba(171,196,255,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card"
              size="lg"
            >
              <Grid className="grid-cols-1 items-center gap-2">
                <PoolStakedOnlyBlock />
                <PoolRefreshCircleBlock />
                <PoolTimeBasisSelectorBox />
              </Grid>
            </Card>
          </div>
        </Popover.Panel>
      </Popover>
    </>
  )
}

function PoolSearchBlock({ className }: { className?: string }) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const storeSearchText = usePools((s) => s.searchText)
  return (
    <Input
      value={storeSearchText}
      className={twMerge(
        'px-2 py-2 mobile:py-1 gap-2 ring-inset ring-1 ring-[rgba(196,214,255,0.5)] rounded-xl mobile:rounded-lg pc:w-[12vw] mobile:w-auto',
        className
      )}
      inputClassName="font-medium text-sm mobile:text-xs text-[rgba(196,214,255,0.5)] placeholder-[rgba(196,214,255,0.5)]"
      prefix={<Icon heroIconName="search" size={isMobile ? 'sm' : 'smi'} className="text-[rgba(196,214,255,0.5)]" />}
      suffix={
        <Icon
          heroIconName="x"
          size={isMobile ? 'xs' : 'sm'}
          className={`text-[rgba(196,214,255,0.5)] transition clickable ${
            storeSearchText ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            usePools.setState({ searchText: '' })
          }}
        />
      }
      placeholder="Search All"
      onUserInput={(searchText) => {
        usePools.setState({ searchText })
      }}
    />
  )
}

function PoolLabelBlock({
  className,
  filterPoolCount,
  showCount = false
}: {
  className?: string
  filterPoolCount?: number
  showCount: boolean
}) {
  return (
    <div className={className}>
      <div className="flex items-end">
        <div className="font-medium text-xl mobile:text-base text-white">Liquidity Pools</div>
        {showCount && (
          <div className="font-normal text-sm mobile:text-base text-[rgba(196,214,255,.5)] ml-2 mb-1">
            (Filtered Pools: {filterPoolCount})
          </div>
        )}
      </div>

      <div className="font-medium text-[rgba(196,214,255,.5)] text-base mobile:text-sm">
        Earn yield on trading fees by providing liquidity
      </div>
    </div>
  )
}

function Filter({ target }: { target: 'liquidity' | 'volume' | 'fees' | 'apr' }) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const filter = usePools((s) => s.filter[target])
  const setFilter = usePools((s) => s.setFilter)
  const resetFilter = usePools((s) => s.resetFilter)

  const minChanging = useCallback(
    (t: string | number | undefined) => {
      setFilter(target, 'min', String(t || ''))
    },
    [target]
  )
  const onMinChanging = useDebounce(minChanging, { debouncedOptions: { delay: 300 } })

  const maxChanging = useCallback(
    (t: string | number | undefined) => {
      setFilter(target, 'max', String(t || ''))
    },
    [target]
  )

  const onMaxChanging = useDebounce(maxChanging, { debouncedOptions: { delay: 300 } })

  const filterValueUnavailable = useMemo(() => {
    return filter.min && filter.max && gt(filter.min, filter.max)
  }, [filter])

  return (
    <>
      <Popover placement="bottom" triggerBy={isMobile ? 'press' : 'hover'}>
        <Popover.Button>
          <div className={twMerge('rounded-full px-1 text-[#abc4ff80] clickable justify-self-start')}>
            <Icon
              size="sm"
              heroIconName="funnel-solid"
              className={filter.max || filter.min ? 'text-[#abc4ff]' : 'text-[#abc4ff40]'}
            />
          </div>
        </Popover.Button>
        <Popover.Panel>
          <div>
            <Card
              className="flex flex-col py-3 px-4  max-h-[80vh] border-1.5 border-[rgba(171,196,255,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card items-center"
              size="lg"
            >
              <Grid className="grid-cols-1 items-center gap-2 ">
                <DecimalInput
                  className={`px-3 py-2 mobile:py-1 ring-inset ring-1 ${
                    filterValueUnavailable ? 'ring-[rgba(255,86,86,0.94)]' : 'ring-[rgba(196,214,255,0.5)]'
                  } rounded-xl mobile:rounded-lg pc:w-[140px] mobile:w-auto`}
                  placeholder={'0'}
                  decimalCount={2}
                  onUserInput={onMinChanging}
                  value={filter.min}
                  prefix={'From:'}
                  prefixClassName={'mobile:text-xs text-sm font-medium text-[rgba(196,214,255,.5)] mr-1'}
                  inputClassName="font-medium text-sm mobile:text-xs text-[rgba(196,214,255)] placeholder-[rgba(196,214,255,0.5)]"
                />
                <DecimalInput
                  className={`px-3 py-2 mobile:py-1 ring-inset ring-1 ${
                    filterValueUnavailable ? 'ring-[rgba(255,86,86,0.94)]' : 'ring-[rgba(196,214,255,0.5)]'
                  } rounded-xl mobile:rounded-lg pc:w-[140px] mobile:w-auto`}
                  value={filter.max}
                  placeholder={'∞'}
                  decimalCount={2}
                  onUserInput={onMaxChanging}
                  prefix={'To:'}
                  prefixClassName={'mobile:text-xs text-sm font-medium text-[rgba(196,214,255,.5)] mr-1'}
                  inputClassName="font-medium text-sm mobile:text-xs text-[rgba(196,214,255)] placeholder-[rgba(196,214,255,0.5)]"
                />
              </Grid>
              {filterValueUnavailable && (
                <div className="text-[rgba(255,86,86,0.94)] mt-2">filter value unavailable</div>
              )}
              <Button
                size="sm"
                className="frosted-glass-teal mt-2 py-1 rounded-xl w-[140px]"
                onClick={() => {
                  resetFilter(target)
                }}
              >
                Reset
              </Button>
            </Card>
          </div>
        </Popover.Panel>
      </Popover>
    </>
  )
}

function PoolTimeBasisSelectorBox({
  className,
  sortConfigs,
  setSortConfig
}: {
  className?: string
  sortConfigs?: SortConfigItem<HydratedPairItemInfo[]>
  setSortConfig?: (simpleConfig: SimplifiedSortConfig<HydratedPairItemInfo[]>) => void
}) {
  const timeBasis = usePools((s) => s.timeBasis)
  return (
    <Select
      className={twMerge('z-20', className)}
      candidateValues={['24H', '7D', '30D']}
      localStorageKey="ui-time-basis"
      defaultValue={timeBasis}
      prefix="Time Basis:"
      onChange={(newSortKey) => {
        usePools.setState({ timeBasis: newSortKey ?? '24H' })
      }}
    />
  )
}

function PoolTableSorterBox({
  className,
  onChange
}: {
  className?: string
  onChange?: (
    sortKey:
      | 'liquidity'
      | 'apr24h'
      | 'apr7d'
      | 'apr30d'
      | 'fee7d'
      | 'fee24h'
      | 'fee30d'
      | 'name'
      | 'volume7d'
      | 'volume24h'
      | 'volume30d'
      | 'favorite'
      | undefined
  ) => void
}) {
  const timeBasis = usePools((s) => s.timeBasis)
  return (
    <Select
      className={className}
      candidateValues={[
        { label: 'Pool', value: 'name' },
        { label: 'Liquidity', value: 'liquidity' },
        {
          label: `Volume ${timeBasis}`,
          value: timeBasis === '24H' ? 'volume24h' : timeBasis === '7D' ? 'volume7d' : 'volume30d'
        },
        {
          label: `Fees ${timeBasis}`,
          value: timeBasis === '24H' ? 'fee24h' : timeBasis === '7D' ? 'fee7d' : 'fee30d'
        },
        { label: `APR ${timeBasis}`, value: timeBasis === '24H' ? 'apr24h' : timeBasis === '7D' ? 'apr7d' : 'apr30d' },
        { label: 'Favorite', value: 'favorite' }
      ]}
      // defaultValue="apr"
      prefix="Sort by:"
      onChange={onChange}
    />
  )
}
function PoolRefreshCircleBlock({ className }: { className?: string }) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const refreshPools = usePools((s) => s.refreshPools)

  return useMemo(() => {
    if (isMobile) {
      return (
        <Row className={twMerge('items-center', className)}>
          <span className="text-[rgba(196,214,255,0.5)] font-medium text-sm mobile:text-xs">Refresh Pools</span>
          <RefreshCircle
            refreshKey="pools"
            freshFunction={() => {
              refreshPools()
            }}
          />
        </Row>
      )
    }

    return (
      <div className={twMerge('justify-self-end', className)}>
        <RefreshCircle
          refreshKey="pools"
          freshFunction={() => {
            refreshPools()
          }}
        />
      </div>
    )
  }, [isMobile, refreshPools])
}

function PoolCard() {
  const balances = useWallet((s) => s.balances)
  const unZeroBalances = objectFilter(balances, (tokenAmount) => gt(tokenAmount, 0))
  const hydratedInfos = usePools((s) => s.hydratedInfos)
  const jsonInfos = usePools((s) => s.jsonInfos)

  const searchText = usePools((s) => s.searchText)
  const debouncedSearchText = useDebounceValue(searchText, { debouncedOptions: { delay: 200 } })
  const currentTab = usePools((s) => s.currentTab)
  const onlySelfPools = usePools((s) => s.onlySelfPools)
  const timeBasis = usePools((s) => s.timeBasis)
  const filter = usePools((s) => s.filter)

  const isMobile = useAppSettings((s) => s.isMobile)
  const [favouriteIds] = usePoolFavoriteIds()
  const [isSortLightOn, setIsSortLightOn] = useState(false)
  const [sorted, setSortedData] = useState<(JsonPairItemInfo | HydratedPairItemInfo)[] | undefined>(undefined)
  const [showCount, setShowCount] = useState(false)
  // const [dataSource, setDataSource] = useState<(JsonPairItemInfo | HydratedPairItemInfo)[]>([])

  const hasHydratedInfoLoaded = hydratedInfos.length > 0

  const dataSource = useMemo(
    () =>
      hasHydratedInfoLoaded
        ? hydratedInfos
            .filter((i) => (currentTab === 'All' ? true : currentTab === 'Raydium' ? i.official : !i.official)) // Tab
            .filter((i) => (onlySelfPools ? Object.keys(unZeroBalances).includes(i.lpMint) : true)) // Switch
        : jsonInfos.filter((i) =>
            currentTab === 'All' ? true : currentTab === 'Raydium' ? i.official : !i.official
          ) /* Tab*/, // Tab
    [onlySelfPools, hydratedInfos, hasHydratedInfoLoaded, jsonInfos]
  ) as (JsonPairItemInfo | HydratedPairItemInfo)[]

  const isTokenUnnamedAndNotUserCustomized = useToken((s) => s.isTokenUnnamedAndNotUserCustomized)

  const originalSearch = useMemo(
    () =>
      searchItems(dataSource, {
        text: debouncedSearchText,
        matchConfigs: (i) =>
          isHydratedPoolItemInfo(i)
            ? [
                i.base && !isTokenUnnamedAndNotUserCustomized(i.base.mint) ? i.base.symbol : undefined,
                i.quote && !isTokenUnnamedAndNotUserCustomized(i.quote.mint) ? i.quote.symbol : undefined,
                { text: i.ammId, entirely: true },
                { text: i.market, entirely: true },
                { text: toPubString(i.base?.mint), entirely: true },
                { text: toPubString(i.quote?.mint), entirely: true }
              ]
            : [...i.name.split('-'), { text: i.ammId, entirely: true }, { text: i.market, entirely: true }],
        sortBetweenSamePriority: ({ item: itemA }, { item: itemB }) => gt(itemA.volume24h, itemB.volume24h)
      }),
    [dataSource, isHydratedPoolItemInfo(dataSource[0]), debouncedSearchText]
  )

  const searched = useDeferredValue(originalSearch)

  // use ref to compute in
  const favouriteIdsRef = useRef<string[]>()
  if (favouriteIds) {
    favouriteIdsRef.current = favouriteIds
  }
  const {
    sortedData: tempSortedData,
    setConfig: setSortConfig,
    sortConfig,
    clearSortConfig
  } = useSort(searched, {
    backgroundSortConfig: {
      sortCompare: (i) => favouriteIdsRef?.current?.includes(i.ammId)
    },
    defaultSortedConfig: {
      get key() {
        const key = timeBasis === TimeBasis.DAY ? 'volume24h' : timeBasis === TimeBasis.WEEK ? 'volume7d' : 'volume30d'
        return key
      },
      sortCompare: (i) => {
        const key = timeBasis === TimeBasis.DAY ? 'volume24h' : timeBasis === TimeBasis.WEEK ? 'volume7d' : 'volume30d'
        return toFraction(i[key])
      }
    }
  })

  useEffect(() => {
    if (!sortConfig || sortConfig.key === 'name' || sortConfig.key === 'liquidity') {
      setIsSortLightOn(true)
    } else {
      setIsSortLightOn(sortConfig.key.includes(timeBasis.toLowerCase()))
    }
  }, [sortConfig, timeBasis])

  const prepareSortedData = useDebounce(
    () => {
      tempSortedData && setSortedData(tempSortedData)
    },
    { debouncedOptions: { delay: 300 } }
  )

  useEffect(prepareSortedData, [tempSortedData])

  const filteredKey = useMemo(() => {
    const timeCategory = timeBasis === '24H' ? '24h' : timeBasis === '7D' ? '7d' : '30d'

    return {
      liquidity: 'liquidity',
      volume: 'volume' + timeCategory,
      fees: 'fee' + timeCategory,
      apr: 'apr' + timeCategory
    }
  }, [timeBasis])

  //TODO: should move to useSearch()
  const filtered = useMemo(() => {
    const availableFilter = objectFilter(filter, (option, key) => Boolean(option.max) || Boolean(option.min))
    const filterTargets = Object.keys(availableFilter)
    if (filterTargets.length === 0) {
      setShowCount(false)
      return sorted
    } else {
      setShowCount(true)
    }

    return sorted?.filter((item) => {
      let passed = true
      for (const filterTarget of filterTargets) {
        if (!filter[filterTarget].min && !filter[filterTarget].max) continue
        const toTargetItem = (item: JsonPairItemInfo | HydratedPairItemInfo) =>
          toString(item[filteredKey[filterTarget]])
        const isLteMax = lte(toTargetItem(item), filter[filterTarget].max)
        const isGteMin = gte(toTargetItem(item), filter[filterTarget].min)
        if (!filter[filterTarget].min && isLteMax) continue
        if (!filter[filterTarget].max && isGteMin) continue

        /** min > max || max < min, do not apply this filter */
        if (
          filter[filterTarget].min &&
          filter[filterTarget].max &&
          (gt(filter[filterTarget].min, filter[filterTarget].max) ||
            lt(filter[filterTarget].max, filter[filterTarget].min))
        )
          continue

        if (isLteMax && isGteMin) continue

        passed = false
        break
      }

      return passed
    })
  }, [sorted, filter, filteredKey])

  const TableHeaderBlock = useMemo(
    () => (
      <Row
        type="grid-x"
        className="mb-3 h-12 justify-between sticky -top-6 backdrop-filter z-10 backdrop-blur-md bg-[rgba(20,16,65,0.2)] mr-scrollbar rounded-xl mobile:rounded-lg gap-2 grid-cols-[auto,1.6fr,1fr,1fr,1fr,.8fr,auto]"
      >
        <Row className="w-20 pl-9"></Row>

        {/* empty header */}
        <Grid className="grid-cols-[.4fr,1.2fr] clickable clickable-filter-effect no-clicable-transform-effect">
          <div></div>

          {/* table head column: Pool */}
          <Row
            className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer"
            onClick={() => {
              setSortConfig({
                key: 'name',
                sortModeQueue: ['increase', 'decrease', 'none'],
                sortCompare: (i) => i.name
              })
            }}
          >
            Pool
            <Icon
              className="ml-1"
              size="sm"
              iconSrc={
                sortConfig?.key === 'name' && sortConfig.mode !== 'none' && isSortLightOn
                  ? sortConfig?.mode === 'decrease'
                    ? '/icons/msic-sort-down.svg'
                    : '/icons/msic-sort-up.svg'
                  : '/icons/msic-sort.svg'
              }
            />
          </Row>
        </Grid>

        {/* table head column: liquidity */}
        <Row
          className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer clickable clickable-filter-effect no-clicable-transform-effect"
          onClick={() => {
            setSortConfig({ key: 'liquidity', sortCompare: (i) => i.liquidity })
          }}
        >
          Liquidity
          <Icon
            className="ml-1"
            size="sm"
            iconSrc={
              sortConfig?.key === 'liquidity' && sortConfig.mode !== 'none' && isSortLightOn
                ? sortConfig?.mode === 'decrease'
                  ? '/icons/msic-sort-down.svg'
                  : '/icons/msic-sort-up.svg'
                : '/icons/msic-sort.svg'
            }
          />
          <Filter target="liquidity" />
        </Row>

        {/* table head column: volume24h */}
        <Row
          className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer clickable clickable-filter-effect no-clicable-transform-effect"
          onClick={() => {
            const key = timeBasis === '24H' ? 'volume24h' : timeBasis === '7D' ? 'volume7d' : 'volume30d'
            setSortConfig({ key, sortCompare: (i) => i[key] })
          }}
        >
          Volume {timeBasis}
          <Icon
            className="ml-1"
            size="sm"
            iconSrc={
              sortConfig?.key.startsWith('volume') && sortConfig.mode !== 'none' && isSortLightOn
                ? sortConfig?.mode === 'decrease'
                  ? '/icons/msic-sort-down.svg'
                  : '/icons/msic-sort-up.svg'
                : '/icons/msic-sort.svg'
            }
          />
          <Filter target="volume" />
        </Row>

        {/* table head column: fee7d */}
        <Row
          className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer clickable clickable-filter-effect no-clicable-transform-effect"
          onClick={() => {
            const key = timeBasis === '24H' ? 'fee24h' : timeBasis === '7D' ? 'fee7d' : 'fee30d'
            setSortConfig({ key, sortCompare: (i) => i[key] })
          }}
        >
          Fees {timeBasis}
          <Icon
            className="ml-1"
            size="sm"
            iconSrc={
              sortConfig?.key.startsWith('fee') && sortConfig.mode !== 'none' && isSortLightOn
                ? sortConfig?.mode === 'decrease'
                  ? '/icons/msic-sort-down.svg'
                  : '/icons/msic-sort-up.svg'
                : '/icons/msic-sort.svg'
            }
          />
          <Filter target="fees" />
        </Row>

        {/* table head column: volume24h */}
        <Row
          className="font-medium text-[#ABC4FF] text-sm items-center cursor-pointer clickable clickable-filter-effect no-clicable-transform-effect"
          onClick={() => {
            const key = timeBasis === '24H' ? 'apr24h' : timeBasis === '7D' ? 'apr7d' : 'apr30d'
            setSortConfig({ key, sortCompare: (i) => i[key] })
          }}
        >
          APR {timeBasis}
          <Tooltip>
            <Icon className="ml-1 cursor-help" size="sm" heroIconName="question-mark-circle" />
            <Tooltip.Panel>
              Estimated APR based on trading fees earned by the pool in the past {timeBasis}
            </Tooltip.Panel>
          </Tooltip>
          <Icon
            className="ml-1"
            size="sm"
            iconSrc={
              sortConfig?.key.startsWith('apr') && sortConfig.mode !== 'none' && isSortLightOn
                ? sortConfig?.mode === 'decrease'
                  ? '/icons/msic-sort-down.svg'
                  : '/icons/msic-sort-up.svg'
                : '/icons/msic-sort.svg'
            }
          />
          <Filter target="apr" />
        </Row>

        <PoolRefreshCircleBlock className="pr-8 self-center" />
      </Row>
    ),
    [sortConfig, timeBasis, isSortLightOn]
  )

  // NOTE: filter widgets
  const innerPoolDatabaseWidgets = isMobile ? (
    <div>
      <Row className="mb-4">
        <Grid className="grow gap-2 grid-cols-auto-fit">
          <PoolSearchBlock />
          <PoolTableSorterBox
            onChange={(newSortKey) => {
              newSortKey
                ? setSortConfig({
                    key: newSortKey,
                    sortCompare:
                      newSortKey === 'favorite' ? (i) => favouriteIds?.includes(i.ammId) : (i) => i[newSortKey]
                  })
                : clearSortConfig()
            }}
          />
        </Grid>
        <ToolsButton className="self-center" />
      </Row>
    </div>
  ) : (
    <div>
      <Row className={'justify-between flex-wrap pb-5  gap-y-4 items-center'}>
        <PoolLabelBlock filterPoolCount={filtered?.length} showCount={showCount} />
        <Row className="gap-4 items-stretch">
          <PoolStakedOnlyBlock />
          {hasHydratedInfoLoaded && (
            <PoolTimeBasisSelectorBox
              sortConfigs={sortConfig}
              setSortConfig={setSortConfig as (simpleConfig: SimplifiedSortConfig<HydratedPairItemInfo[]>) => void}
            />
          )}
          <PoolSearchBlock />
        </Row>
      </Row>
    </div>
  )

  return (
    <CyberpunkStyleCard
      haveMinHeight
      wrapperClassName="flex-1 overflow-hidden flex flex-col"
      className="p-10 pb-4 mobile:px-3 mobile:py-3 w-full flex flex-col flex-grow h-full"
    >
      {innerPoolDatabaseWidgets}
      {!isMobile && TableHeaderBlock}
      <PoolCardDatabaseBody
        sortedItems={filtered}
        searchedItemsLength={searched.length}
        sourceItemsLength={dataSource.length}
        hasSearchText={Boolean(searchText)}
      />
    </CyberpunkStyleCard>
  )
}

function PoolCardDatabaseBody({
  sortedItems,
  sourceItemsLength,
  hasSearchText,
  searchedItemsLength
}: {
  sortedItems: (JsonPairItemInfo | HydratedPairItemInfo)[] | undefined
  sourceItemsLength: number
  hasSearchText: boolean
  searchedItemsLength: number
}) {
  const jsonInfos = usePools((s) => s.jsonInfos)
  const jsonInfoMap = useMemo(() => listToMap(jsonInfos, (i) => i.ammId), [jsonInfos])
  const hydratedInfos = usePools((s) => s.hydratedInfos)
  const loading = jsonInfos.length == 0 && hydratedInfos.length === 0
  const expandedPoolIds = usePools((s) => s.expandedPoolIds)
  const [favouriteIds, setFavouriteIds] = usePoolFavoriteIds()
  return !loading && (searchedItemsLength === 0 || (searchedItemsLength !== 0 && sortedItems?.length === 0)) ? (
    <div className="text-center text-2xl p-12 opacity-50 text-[rgb(171,196,255)]">{'(No results found)'}</div>
  ) : sortedItems && sortedItems.length ? (
    <List
      items={sortedItems}
      getItemKey={(info) => info.lpMint}
      className="gap-3 mobile:gap-2 text-[#ABC4FF] flex-1 -mx-2 px-2" /* let scrollbar have some space */
    >
      {(info) => (
        <Collapse
          open={expandedPoolIds.has(info.ammId)}
          onToggle={() => {
            usePools.setState((s) => ({ expandedPoolIds: toggleSetItem(s.expandedPoolIds, info.ammId) }))
          }}
        >
          <Collapse.Face>
            {({ isOpen }) => (
              <PoolCardDatabaseBodyCollapseItemFace
                open={isOpen}
                info={info}
                correspondingJsonInfo={jsonInfoMap[info.ammId]}
                isFavourite={favouriteIds?.includes(info.ammId)}
                onUnFavorite={(ammId) => {
                  setFavouriteIds((ids) => removeItem(ids ?? [], ammId))
                }}
                onStartFavorite={(ammId) => {
                  setFavouriteIds((ids) => addItem(ids ?? [], ammId))
                }}
              />
            )}
          </Collapse.Face>
          <Collapse.Body>
            {isHydratedPoolItemInfo(info) && <PoolCardDatabaseBodyCollapseItemContent poolInfo={info} />}
          </Collapse.Body>
        </Collapse>
      )}
    </List>
  ) : (
    <div className="text-center text-2xl p-12 opacity-50 text-[rgb(171,196,255)]">
      <LoadingCircle />
    </div>
  )
}

function PoolCardDatabaseBodyCollapseItemFace({
  open,
  info,
  correspondingJsonInfo,
  isFavourite,
  onUnFavorite,
  onStartFavorite
}: {
  open: boolean
  info: JsonPairItemInfo | HydratedPairItemInfo
  correspondingJsonInfo?: JsonPairItemInfo
  isFavourite?: boolean
  onUnFavorite?: (ammId: string) => void
  onStartFavorite?: (ammId: string) => void
}) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const isTablet = useAppSettings((s) => s.isTablet)
  const timeBasis = usePools((s) => s.timeBasis)

  const liquidityInfo = () => {
    const lowLiquidityAlertText = `This pool has relatively low liquidity. Always check the quoted price
     and that the pool has sufficient liquidity before trading.`
    return (
      <Row className="flex justify-start items-center">
        {toUsdVolume((correspondingJsonInfo ?? info).liquidity, { autoSuffix: isTablet, decimalPlace: 0 })}
        {lt(info?.liquidity.toFixed(0) ?? 0, 100000) && (
          <Tooltip placement="right">
            <Icon size="sm" heroIconName="question-mark-circle" className="cursor-help ml-1" />
            <Tooltip.Panel>
              <div className="max-w-[min(320px,80vw)]">{lowLiquidityAlertText}</div>
            </Tooltip.Panel>
          </Tooltip>
        )}
      </Row>
    )
  }

  const pcCotent = (
    <Row
      type="grid-x"
      className={`py-5 mobile:py-4 mobile:px-5 bg-[#141041] items-center gap-2 grid-cols-[auto,1.6fr,1fr,1fr,1fr,.8fr,auto] mobile:grid-cols-[1fr,1fr,1fr,auto] rounded-t-3xl mobile:rounded-t-lg ${
        open ? '' : 'rounded-b-3xl mobile:rounded-b-lg'
      } transition-all`}
    >
      <div className="w-12 self-center ml-6 mr-2">
        {isFavourite ? (
          <Icon
            iconSrc="/icons/misc-star-filled.svg"
            onClick={({ ev }) => {
              ev.stopPropagation()
              onUnFavorite?.(info.ammId)
            }}
            className="clickable clickable-mask-offset-2 m-auto self-center"
          />
        ) : (
          <Icon
            iconSrc="/icons/misc-star-empty.svg"
            onClick={({ ev }) => {
              ev.stopPropagation()
              onStartFavorite?.(info.ammId)
            }}
            className="clickable clickable-mask-offset-2 opacity-30 hover:opacity-80 transition m-auto self-center"
          />
        )}
      </div>

      <CoinAvatarInfoItem info={info} className="pl-0" />

      <TextInfoItem name="Liquidity" value={liquidityInfo()} />
      <TextInfoItem
        name={`Volume(${timeBasis})`}
        value={
          timeBasis === '24H'
            ? toUsdVolume((correspondingJsonInfo ?? info).volume24h, { autoSuffix: isTablet, decimalPlace: 0 })
            : timeBasis === '7D'
            ? toUsdVolume((correspondingJsonInfo ?? info).volume7d, { autoSuffix: isTablet, decimalPlace: 0 })
            : toUsdVolume((correspondingJsonInfo ?? info).volume30d, { autoSuffix: isTablet, decimalPlace: 0 })
        }
      />
      <TextInfoItem
        name={`Fees(${timeBasis})`}
        value={
          timeBasis === '24H'
            ? toUsdVolume((correspondingJsonInfo ?? info).fee24h, { autoSuffix: isTablet, decimalPlace: 0 })
            : timeBasis === '7D'
            ? toUsdVolume((correspondingJsonInfo ?? info).fee7d, { autoSuffix: isTablet, decimalPlace: 0 })
            : toUsdVolume((correspondingJsonInfo ?? info).fee30d, { autoSuffix: isTablet, decimalPlace: 0 })
        }
      />
      <TextInfoItem
        name={`APR(${timeBasis})`}
        value={
          timeBasis === '24H'
            ? formatApr((correspondingJsonInfo ?? info).apr24h, { alreadyPercented: true })
            : timeBasis === '7D'
            ? formatApr((correspondingJsonInfo ?? info).apr7d, { alreadyPercented: true })
            : formatApr((correspondingJsonInfo ?? info).apr30d, { alreadyPercented: true })
        }
      />
      <Grid className="w-9 h-9 mr-8 place-items-center">
        <Icon size="sm" heroIconName={`${open ? 'chevron-up' : 'chevron-down'}`} />
      </Grid>
    </Row>
  )

  const mobileContent = (
    <Collapse open={open}>
      <Collapse.Face>
        <Row
          type="grid-x"
          className={`py-3 px-3 items-center gap-2 grid-cols-[auto,1.5fr,1fr,1fr,auto] bg-[#141041] mobile:rounded-t-lg ${
            open ? '' : 'rounded-b-3xl mobile:rounded-b-lg'
          }`}
        >
          <div className="w-8 self-center ">
            {isFavourite ? (
              <Icon
                className="clickable m-auto self-center"
                iconSrc="/icons/misc-star-filled.svg"
                onClick={({ ev }) => {
                  ev.stopPropagation()
                  onUnFavorite?.(info.ammId)
                }}
                size="sm"
              />
            ) : (
              <Icon
                className="clickable opacity-30 hover:opacity-80 transition clickable-mask-offset-2 m-auto self-center"
                iconSrc="/icons/misc-star-empty.svg"
                onClick={({ ev }) => {
                  ev.stopPropagation()
                  onStartFavorite?.(info.ammId)
                }}
                size="sm"
              />
            )}
          </div>

          <CoinAvatarInfoItem info={info} />

          <TextInfoItem name="Liquidity" value={liquidityInfo()} />
          <TextInfoItem
            name={`APR(${timeBasis})`}
            value={
              isHydratedPoolItemInfo(info)
                ? timeBasis === '24H'
                  ? formatApr((correspondingJsonInfo ?? info).apr24h, { alreadyPercented: true })
                  : timeBasis === '7D'
                  ? formatApr((correspondingJsonInfo ?? info).apr7d, { alreadyPercented: true })
                  : formatApr((correspondingJsonInfo ?? info).apr30d, { alreadyPercented: true })
                : undefined
            }
          />

          <Grid className="w-6 h-6 place-items-center">
            <Icon size="sm" heroIconName={`${open ? 'chevron-up' : 'chevron-down'}`} />
          </Grid>
        </Row>
      </Collapse.Face>

      <Collapse.Body>
        <Row
          type="grid-x"
          className="py-4 px-5 pl-12 relative items-center gap-2 grid-cols-[1.5fr,1fr,1fr,auto]  bg-[#141041]"
        >
          <div className="absolute top-0 left-5 right-5 border-[rgba(171,196,255,.2)] border-t-1.5"></div>
          <TextInfoItem
            name="Volume(7d)"
            value={
              isHydratedPoolItemInfo(info)
                ? toUsdVolume((correspondingJsonInfo ?? info).volume7d, { autoSuffix: true, decimalPlace: 0 })
                : undefined
            }
          />
          <TextInfoItem
            name="Volume(24h)"
            value={
              isHydratedPoolItemInfo(info)
                ? toUsdVolume((correspondingJsonInfo ?? info).volume24h, { autoSuffix: true, decimalPlace: 0 })
                : undefined
            }
          />
          <TextInfoItem
            name="Fees(7d)"
            value={
              isHydratedPoolItemInfo(info)
                ? toUsdVolume((correspondingJsonInfo ?? info).fee7d, { autoSuffix: true, decimalPlace: 0 })
                : undefined
            }
          />

          <Grid className="w-6 h-6 place-items-center"></Grid>
        </Row>
      </Collapse.Body>
    </Collapse>
  )

  return isMobile ? mobileContent : pcCotent
}

function PoolCardDatabaseBodyCollapseItemContent({ poolInfo: info }: { poolInfo: HydratedPairItemInfo }) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const balances = useWallet((s) => s.balances)
  const lightBoardClass = 'bg-[rgba(20,16,65,.2)]'
  const farmPoolsList = useFarms((s) => s.hydratedInfos)
  const prices = usePools((s) => s.lpPrices)

  const hasLp = isMeaningfulNumber(balances[info.lpMint])

  const correspondingFarm = useMemo(
    () => farmPoolsList.find((farmInfo) => isMintEqual(farmInfo.lpMint, info.lpMint) && !farmInfo.isClosedPool),
    [info]
  )

  return (
    <AutoBox
      is={isMobile ? 'Col' : 'Row'}
      className={`justify-between rounded-b-3xl mobile:rounded-b-lg`}
      style={{
        background: 'linear-gradient(126.6deg, rgba(171, 196, 255, 0.12), rgb(171 196 255 / 4%) 100%)'
      }}
    >
      <AutoBox
        is={isMobile ? 'Grid' : 'Row'}
        className={`py-5 px-8 mobile:py-3 mobile:px-4 gap-[4vw] mobile:gap-3 mobile:grid-cols-3-auto flex-grow justify-between mobile:m-0`}
      >
        <Row>
          <div className="flex-grow">
            <div className="text-[rgba(171,196,255,0.5)] font-medium text-sm mobile:text-2xs mb-1">Your Liquidity</div>
            <div className="text-white font-medium text-base mobile:text-xs">
              {toUsdVolume(toTotalPrice(balances[info.lpMint], prices[info.lpMint]))}
            </div>
            <div className="text-[rgba(171,196,255,0.5)] font-medium text-sm mobile:text-2xs">
              {isHydratedPoolItemInfo(info) ? toString(balances[info.lpMint] ?? 0) + ' LP' : '--'}
            </div>
          </div>
        </Row>
        <Row>
          <div className="flex-grow">
            <div className="text-[rgba(171,196,255,0.5)] font-medium text-sm mobile:text-2xs mb-1">Assets Pooled</div>
            <div className="text-white font-medium text-base mobile:text-xs">
              {isHydratedPoolItemInfo(info) ? `${toString(info.basePooled || 0)} ${info.base?.symbol ?? ''}` : '--'}
            </div>
            <div className="text-white font-medium text-base mobile:text-xs">
              {isHydratedPoolItemInfo(info) ? `${toString(info.quotePooled || 0)} ${info.quote?.symbol ?? ''}` : '--'}
            </div>
          </div>
        </Row>
        <Row>
          <div className="flex-grow">
            <div className="text-[rgba(171,196,255,0.5)] font-medium text-sm mobile:text-2xs mb-1">Your Share</div>
            <div className="text-white font-medium text-base mobile:text-xs">
              {isHydratedPoolItemInfo(info) ? toPercentString(info.sharePercent) : '--%'}
            </div>
          </div>
        </Row>
      </AutoBox>

      <Row
        className={`px-8 py-2 gap-3 items-center self-center justify-center ${
          isMobile ? lightBoardClass : ''
        } mobile:w-full`}
      >
        {isMobile ? (
          <Row className="gap-5">
            <Icon
              size="sm"
              heroIconName="plus"
              className="grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] clickable clickable-filter-effect"
              onClick={() => {
                routeTo('/liquidity/add', {
                  queryProps: {
                    ammId: info.ammId,
                    coin1: info.base,
                    coin2: info.quote,
                    coin1Mint: info.baseMint,
                    coin2Mint: info.quoteMint
                  }
                })
              }}
            />
            <Icon
              size="sm"
              iconSrc="/icons/pools-remove-liquidity-entry.svg"
              className={`grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] clickable clickable-filter-effect`}
              onClick={() => {
                routeTo('/liquidity/add', {
                  queryProps: {
                    ammId: info.ammId,
                    mode: 'removeLiquidity',
                    coin1: info.base,
                    coin2: info.quote,
                    coin1Mint: info.baseMint,
                    coin2Mint: info.quoteMint
                  }
                })
              }}
            />
            <Icon
              size="sm"
              iconSrc="/icons/msic-swap-h.svg"
              className="grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] clickable clickable-filter-effect"
              onClick={() => {
                routeTo('/swap', {
                  queryProps: {
                    coin1: info.base,
                    coin2: info.quote
                  }
                })
              }}
            />
          </Row>
        ) : (
          <>
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                routeTo('/liquidity/add', {
                  queryProps: {
                    ammId: info.ammId,
                    coin1: info.base,
                    coin2: info.quote,
                    coin1Mint: info.baseMint,
                    coin2Mint: info.quoteMint
                  }
                })
              }}
            >
              Add Liquidity
            </Button>
            <Tooltip>
              <Icon
                size="smi"
                iconSrc="/icons/pools-farm-entry.svg"
                className={`grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] clickable-filter-effect ${
                  correspondingFarm ? 'clickable' : 'not-clickable'
                }`}
                onClick={() => {
                  routeTo('/farms', {
                    //@ts-expect-error no need to care about enum of this error
                    queryProps: objectShakeFalsy({
                      currentTab: correspondingFarm?.category ? capitalize(correspondingFarm?.category) : undefined,
                      newExpandedItemId: toPubString(correspondingFarm?.id),
                      searchText: info.lpMint
                    })
                  })
                }}
              />
              <Tooltip.Panel>Farm</Tooltip.Panel>
            </Tooltip>
            <Tooltip>
              <Icon
                size="smi"
                iconSrc="/icons/pools-remove-liquidity-entry.svg"
                className={`grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] ${
                  hasLp ? 'opacity-100 clickable clickable-filter-effect' : 'opacity-50 not-clickable'
                }`}
                onClick={() => {
                  hasLp &&
                    routeTo('/liquidity/add', {
                      queryProps: {
                        ammId: info.ammId,
                        mode: 'removeLiquidity',
                        coin1: info.base,
                        coin2: info.quote,
                        coin1Mint: info.baseMint,
                        coin2Mint: info.quoteMint
                      }
                    })
                }}
              />
              <Tooltip.Panel>Remove Liquidity</Tooltip.Panel>
            </Tooltip>
            <Tooltip>
              <Icon
                iconSrc="/icons/msic-swap-h.svg"
                size="smi"
                className="grid place-items-center w-10 h-10 mobile:w-8 mobile:h-8 ring-inset ring-1 mobile:ring-1 ring-[rgba(171,196,255,.5)] rounded-xl mobile:rounded-lg text-[rgba(171,196,255,.5)] clickable clickable-filter-effect"
                onClick={() => {
                  routeTo('/swap', {
                    queryProps: {
                      coin1: info.base,
                      coin2: info.quote
                    }
                  })
                }}
              />
              <Tooltip.Panel>Swap</Tooltip.Panel>
            </Tooltip>
          </>
        )}
      </Row>
    </AutoBox>
  )
}

function CoinAvatarInfoItem({
  info,
  className
}: {
  info: HydratedPairItemInfo | JsonPairItemInfo | undefined
  className?: string
}) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const [isDetailReady, setIsDetailReady] = useState(false)

  useEffect(() => {
    if (isHydratedPoolItemInfo(info) && info?.base && info.quote) {
      setIsDetailReady(true)
    }
  }, [isHydratedPoolItemInfo(info) && info?.base, isHydratedPoolItemInfo(info) && info?.quote])

  return (
    <AutoBox
      is={isMobile ? 'Col' : 'Row'}
      className={twMerge('clickable flex-wrap items-center mobile:items-start', className)}
      // onClick={() => {
      //   if (!isMobile) push(`/liquidity/?ammId=${ammId}`)
      // }}
    >
      <CoinAvatarPair
        className="justify-self-center mr-2"
        size={isMobile ? 'sm' : 'md'}
        token1={isHydratedPoolItemInfo(info) ? info?.base : undefined}
        token2={isHydratedPoolItemInfo(info) ? info?.quote : undefined}
      />
      <Row className="mobile:text-xs font-medium mobile:mt-px items-center flex-wrap gap-2">
        <Row className="mobile:text-xs font-medium mobile:mt-px mr-1.5 items-center">
          {!isDetailReady ? (
            info?.name
          ) : (
            <>
              <CoinAvatarInfoItemSymbol token={isHydratedPoolItemInfo(info) ? info?.base : undefined} />-
              <CoinAvatarInfoItemSymbol token={isHydratedPoolItemInfo(info) ? info?.quote : undefined} />
              {isHydratedPoolItemInfo(info) && (
                <Tooltip>
                  <Icon iconClassName="ml-1" size="sm" heroIconName="information-circle" />
                  <Tooltip.Panel>
                    <div className="max-w-[300px] space-y-1.5">
                      <div className="flex gap-2 text-sm">
                        <span>Pool Id</span>
                        <AddressItem
                          className="grow"
                          showDigitCount={5}
                          addressType="account"
                          canCopy
                          canExternalLink
                          textClassName="flex text-xs text-[#abc4ff] justify-start "
                          iconClassName="text-[#abc4ff]"
                        >
                          {info?.ammId}
                        </AddressItem>
                      </div>
                      {[info?.base, info?.quote].map((token, idx) =>
                        token ? (
                          <Row key={idx} className="gap-2">
                            <CoinAvatar size={'xs'} token={token} />
                            <span>{token.symbol}</span>
                            <AddressItem
                              className="grow"
                              showDigitCount={5}
                              addressType="token"
                              canCopy
                              canExternalLink
                              textClassName="flex text-xs text-[#abc4ff] justify-start "
                              iconClassName="text-[#abc4ff]"
                            >
                              {token.mintString}
                            </AddressItem>
                          </Row>
                        ) : null
                      )}
                    </div>
                  </Tooltip.Panel>
                </Tooltip>
              )}
            </>
          )}
        </Row>
        {isHydratedPoolItemInfo(info) && info.isStablePool && <Badge className="self-center">Stable</Badge>}
        {isHydratedPoolItemInfo(info) && info.isOpenBook && <OpenBookTip></OpenBookTip>}
      </Row>
    </AutoBox>
  )
}

function TextInfoItem({ name, value }: { name: string; value?: any }) {
  const isMobile = useAppSettings((s) => s.isMobile)
  return isMobile ? (
    <div>
      <div className="mb-1 text-[rgba(171,196,255,0.5)] font-medium text-2xs">{name}</div>
      <div className="text-xs">{value || '--'}</div>
    </div>
  ) : (
    <div className="tablet:text-sm">{value || '--'}</div>
  )
}

function CoinAvatarInfoItemSymbol({ token }: { token: SplToken | undefined }) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const isTokenUnnamed = useToken((s) => s.isTokenUnnamed)

  return token && isTokenUnnamed(token.mint) ? (
    <Row className="items-center">
      <div>{token?.symbol ?? 'UNKNOWN'}</div>
      <div>
        <Tooltip>
          <Icon className="cursor-help" size="sm" heroIconName="question-mark-circle" />
          <Tooltip.Panel>
            <div className="max-w-[300px]">
              This token does not currently have a ticker symbol. Check to ensure it is the token you want to interact
              with.{' '}
              <span
                style={{ color: '#abc4ff', cursor: 'pointer' }}
                onClick={() => {
                  setShowEditDialog(true)
                }}
              >
                [Edit token]
              </span>
            </div>
          </Tooltip.Panel>
        </Tooltip>
      </div>
      <EditTokenDialog
        open={showEditDialog}
        token={token}
        onClose={() => {
          setShowEditDialog(false)
        }}
      />
    </Row>
  ) : (
    <>{token?.symbol ?? 'UNKNOWN'}</>
  )
}

function EditTokenDialog({ open, token, onClose }: { open: boolean; token: SplToken; onClose: () => void }) {
  const addUserAddedToken = useToken((s) => s.addUserAddedToken)
  const editUserAddedToken = useToken((s) => s.editUserAddedToken)
  const refreshTokenList = useToken((s) => s.refreshTokenList)
  const userAddedTokens = useToken((s) => s.userAddedTokens)

  // if we got custom symbol/name, use them, otherwise use token original symbol/name
  const [newInfo, setNewInfo] = useState({
    symbol: userAddedTokens[token.mintString] ? userAddedTokens[token.mintString].symbol : token.symbol,
    name: userAddedTokens[token.mintString] ? userAddedTokens[token.mintString].name : token.name
  })

  return (
    <ResponsiveDialogDrawer maskNoBlur placement="from-bottom" open={open} onClose={onClose}>
      {({ close }) => (
        <Card
          className={twMerge(
            `flex flex-col p-8 mobile:p-5 rounded-3xl mobile:rounded-b-none mobile:h-[80vh] w-[min(552px,100vw)] mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)]`
          )}
          size="lg"
          style={{
            background:
              'linear-gradient(140.14deg, rgba(0, 182, 191, 0.15) 0%, rgba(27, 22, 89, 0.1) 86.61%), linear-gradient(321.82deg, #18134D 0%, #1B1659 100%)',
            boxShadow: '0px 8px 48px rgba(171, 196, 255, 0.12)'
          }}
        >
          <Row className="justify-between items-center mb-6">
            <div className="text-3xl font-semibold text-white">Update Token Symbol/Name</div>
            <Icon className="text-[#ABC4FF] cursor-pointer" heroIconName="x" onClick={close} />
          </Row>
          <Col className="p-1  gap-4">
            <InputBox
              value={newInfo.symbol}
              label="input a symbol for this token"
              onUserInput={(e) => {
                setNewInfo((prev) => ({ ...prev, symbol: e }))
              }}
            />
            <InputBox
              value={newInfo.name}
              label="input a name for this token (optional)"
              onUserInput={(e) => {
                setNewInfo((prev) => ({ ...prev, name: e }))
              }}
            />
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                const mintPubString = token.mintString
                if (userAddedTokens[mintPubString]) {
                  editUserAddedToken({ symbol: newInfo.symbol ?? '', name: newInfo.name ?? '' }, token.mint)
                } else {
                  const newToken: SplToken = {
                    ...token,
                    symbol: newInfo.symbol ?? '',
                    name: newInfo.name ?? '',
                    userAdded: true,
                    equals: token.equals
                  }
                  addUserAddedToken(newToken)
                }
                refreshTokenList()
                close()
              }}
              validators={[{ should: newInfo.symbol }]}
            >
              Confirm
            </Button>
          </Col>
        </Card>
      )}
    </ResponsiveDialogDrawer>
  )
}
