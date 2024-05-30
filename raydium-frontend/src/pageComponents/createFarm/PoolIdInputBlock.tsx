import { RefObject, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { ApiPoolInfoItem } from '@raydium-io/raydium-sdk'

import useAppSettings from '@/application/common/useAppSettings'
import useCreateFarms from '@/application/createFarm/useCreateFarm'
import useLiquidity from '@/application/liquidity/useLiquidity'
import { usePools } from '@/application/pools/usePools'
import useToken from '@/application/token/useToken'
import { AddressItem } from '@/components/AddressItem'
import AutoComplete, { AutoCompleteCandidateItem } from '@/components/AutoComplete'
import Card from '@/components/Card'
import CoinAvatarPair from '@/components/CoinAvatarPair'
import FadeInStable from '@/components/FadeIn'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import Row from '@/components/Row'
import listToMap from '@/functions/format/listToMap'
import toUsdVolume from '@/functions/format/toUsdVolume'
import { isValidPublicKey } from '@/functions/judgers/dateType'
import { useClickOutside } from '@/hooks/useClickOutside'

export interface PoolIdInputBlockHandle {
  validate?: () => void
  turnOffValidation?: () => void
}

export function PoolIdInputBlock({
  componentRef,
  onInputValidate
}: {
  componentRef?: RefObject<any>
  onInputValidate?: (result: boolean) => void
}) {
  const isMoblie = useAppSettings((s) => s.isMobile)
  const poolId = useCreateFarms((s) => s.poolId)
  const pairInfos = usePools((s) => s.hydratedInfos)
  const liquidityPoolJsons = useLiquidity((s) => s.jsonInfos)
  const rawLiquidityPoolJsons = usePools((s) => s.rawJsonInfos)
  const tokens = useToken((s) => s.tokens)

  const liquidityPoolMap = useMemo(() => listToMap(liquidityPoolJsons, (s) => s.id), [liquidityPoolJsons])
  const rawliquidityPoolMap = useMemo(() => listToMap(rawLiquidityPoolJsons, (s) => s.ammId), [rawLiquidityPoolJsons])
  const pairInfoMap = useMemo(() => listToMap(pairInfos, (s) => s.ammId), [pairInfos])

  const selectedPool = liquidityPoolJsons.find((i) => i.id === poolId)
  const selectedPoolPairInfo = pairInfos.find((i) => i.ammId === poolId)

  const isTokenUnnamedAndNotUserCustomized = useToken((s) => s.isTokenUnnamedAndNotUserCustomized)

  const candidates = liquidityPoolJsons
    // .filter((p) => tokens[p.baseMint] && tokens[p.quoteMint])
    .map((pool) =>
      Object.assign({ ...pool }, {
        label: pool.id,
        // searchText: `${tokens[pool.baseMint]?.symbol} ${tokens[pool.quoteMint]?.symbol} ${pool.id}`
        searchText: (i) => [
          { text: i.id, entirely: true },
          { text: i.baseMint, entirely: true }, // Input Auto complete result sort setting
          { text: i.quoteMint, entirely: true },
          tokens[i.baseMint] && !isTokenUnnamedAndNotUserCustomized(tokens[i.baseMint].mint)
            ? tokens[i.baseMint].symbol
            : undefined,
          tokens[i.quoteMint] && !isTokenUnnamedAndNotUserCustomized(tokens[i.quoteMint].mint)
            ? tokens[i.quoteMint].symbol
            : undefined
          // tokens[i.baseMint]?.name,
          // tokens[i.quoteMint]?.name
        ]
      } as AutoCompleteCandidateItem<ApiPoolInfoItem>)
    )

  // state for validate
  const [inputValue, setInputValue] = useState<string>()
  const [isInit, setIsInit] = useState(() => !inputValue)
  const [isInputing, setIsInputing] = useState(false) // true for don't pop valid result immediately
  const inputCardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    inputValue && setIsInit(false)
  }, [inputValue])

  useEffect(() => {
    const result = Boolean(selectedPool && inputValue)
    onInputValidate?.(result)
  }, [inputValue])

  const validate = () => {
    setIsInputing(false)
  }
  const turnOffValidation = () => {
    setIsInputing(true)
  }
  useClickOutside(inputCardRef, {
    onBlurToOutside: validate
  })

  useImperativeHandle<any, PoolIdInputBlockHandle>(componentRef, () => ({
    validate,
    turnOffValidation
  }))

  return (
    <Card
      className={`p-4 mobile:p-2 bg-cyberpunk-card-bg border-1.5 border-[#abc4ff1a] ${
        isMoblie ? 'rounded-2xl' : 'rounded-3xl'
      }`}
      domRef={inputCardRef}
    >
      <AutoComplete
        candidates={candidates}
        value={selectedPool?.id}
        className="p-4 py-3 gap-2 bg-[#141041] rounded-xl min-w-[7em]"
        inputClassName="font-medium mobile:text-xs text-[#abc4ff] placeholder-[#abc4Ff80]"
        suffix={<Icon heroIconName="search" className="text-[rgba(196,214,255,0.5)]" />}
        placeholder="Search for a pool or paste AMM ID"
        renderCandidateItem={({ candidate, isSelected }) => (
          <Grid
            className={`py-3 px-4 mobile:p-2 items-center grid-cols-[auto,auto,1fr,auto] mobile:grid-cols-[auto,1fr,1fr] gap-2 mobile:gap-1 ${
              isSelected ? 'backdrop-brightness-50' : ''
            }`}
          >
            <CoinAvatarPair
              token1={tokens[candidate.baseMint]}
              token2={tokens[candidate.quoteMint]}
              size={isMoblie ? 'smi' : 'md'}
            />
            <div className="text-[#abc4ff] font-medium mobile:text-sm">
              {tokens[candidate.baseMint]?.symbol ?? 'UNKNOWN'}-{tokens[candidate.quoteMint]?.symbol ?? 'UNKNOWN'}
            </div>
            {pairInfoMap[candidate.id] ?? rawliquidityPoolMap[candidate.id] ? (
              <div className="text-[#abc4ff80] text-sm font-medium mobile:text-end">
                {toUsdVolume(pairInfoMap[candidate.id]?.liquidity ?? rawliquidityPoolMap[candidate.id]?.liquidity, {
                  decimalPlace: 0
                })}
              </div>
            ) : (
              <div></div>
            )}
            <AddressItem
              canCopy={false}
              showDigitCount={isMoblie ? 16 : 8}
              className="mobile:col-span-full"
              textClassName="text-[#abc4ff80] text-sm mobile:text-xs"
            >
              {candidate.id}
            </AddressItem>
          </Grid>
        )}
        onSelectCandiateItem={({ selected }) => {
          setIsInputing(false)
          useCreateFarms.setState({ poolId: selected.id })
        }}
        onBlurMatchCandiateFailed={({ text: candidatedPoolId }) => {
          useCreateFarms.setState({ poolId: isValidPublicKey(candidatedPoolId) ? candidatedPoolId : undefined })
        }}
        onDangerousValueChange={(v) => {
          if (!v) useCreateFarms.setState({ poolId: undefined })
          if (isValidPublicKey(v)) useCreateFarms.setState({ poolId: v })
          setInputValue(v)
        }}
        onUserInput={() => {
          setIsInit(false)
          setIsInputing(true)
        }}
        onBlur={() => {
          setIsInputing(false)
        }}
      />

      <FadeInStable show={!isInputing && !isInit}>
        <Row className="items-center px-4 pt-2 gap-2">
          {selectedPool ? (
            <>
              <CoinAvatarPair
                token1={tokens[selectedPool.baseMint]}
                token2={tokens[selectedPool.quoteMint]}
                size={isMoblie ? 'smi' : 'md'}
              />
              <div className="text-[#abc4ff] text-base mobile:text-sm font-medium">
                {tokens[selectedPool.baseMint]?.symbol ?? 'UNKNOWN'} -{' '}
                {tokens[selectedPool.quoteMint]?.symbol ?? 'UNKNOWN'}
              </div>
              {selectedPoolPairInfo ? (
                <div className="text-[#abc4ff80] text-sm mobile:text-xs ml-auto font-medium">
                  Liquidity: {toUsdVolume(selectedPoolPairInfo.liquidity, { decimalPlace: 0 })}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Icon size="smi" heroIconName="x-circle" className="text-[#DA2EEF]" />
              <div className="text-[#DA2EEF] text-sm font-medium">
                {inputValue ? "Can't find pool" : 'You need to select one pool'}
              </div>
            </>
          )}
        </Row>
      </FadeInStable>
    </Card>
  )
}
