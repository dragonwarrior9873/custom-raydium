import { Fraction } from '@raydium-io/raydium-sdk'
import { twMerge } from 'tailwind-merge'

import useAppSettings from '@/application/common/useAppSettings'
import { SplToken } from '@/application/token/type'
import { AddressItem } from '@/components/AddressItem'
import Button from '@/components/Button'
import Card from '@/components/Card'
import CoinAvatar from '@/components/CoinAvatar'
import Col from '@/components/Col'
import Dialog from '@/components/Dialog'
import Icon from '@/components/Icon'
import Image from '@/components/Image'
import Row from '@/components/Row'
import toPercentString from '@/functions/format/toPercentString'
import { minus } from '@/functions/numberish/operations'
import { shakeZero } from '@/functions/numberish/shakeZero'
import { toString } from '@/functions/numberish/toString'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { Numberish } from '@/types/constants'
import { useCallback, useRef, useState } from 'react'
import Tooltip from '@/components/Tooltip'
import { isMeaningfulNumber } from '@/functions/numberish/compare'

interface Props {
  onRefreshSnapshot(): void
  // input data is snapshot which may out of date
  isSnapshotDataFresh: boolean
  haveEnoughCoin1: boolean | undefined
  haveEnoughCoin2: boolean | undefined
  // after update, price range may be out of settinged range
  inRange?: boolean

  open: boolean
  coin1?: SplToken
  coin2?: SplToken
  coin1Amount?: Numberish
  coin1AmountFee?: Numberish
  coin2Amount?: Numberish
  coin2AmountFee?: Numberish
  decimals?: number
  currentPrice?: Fraction
  position?: { min: number; max: number }
  gettedNFTAddress?: string
  totalDeposit: string
  onBackToAllMyPools?: () => void
  onConfirm?: (close: () => void) => void
  onClose: () => void
  feeRate?: number
}
function useHaveUpdated(payload: { freshState?: boolean; restartState: unknown }) {
  const [hasUpdated, setHasUpdated] = useState(false)
  useIsomorphicLayoutEffect(() => {
    setHasUpdated(false)
  }, [payload.restartState])
  useIsomorphicLayoutEffect(() => {
    if (payload.freshState) {
      setHasUpdated(true)
    }
  }, [payload.freshState])
  return hasUpdated
}

export default function AddLiquidityConfirmDialog({
  open,
  haveEnoughCoin1,
  haveEnoughCoin2,
  coin1,
  coin2,
  coin1Amount,
  coin1AmountFee,
  coin2Amount,
  coin2AmountFee,
  decimals,
  currentPrice,
  position,
  gettedNFTAddress,
  totalDeposit,
  feeRate,
  inRange,
  onBackToAllMyPools,
  onConfirm,
  onClose,

  onRefreshSnapshot,
  isSnapshotDataFresh
}: Props) {
  const hasConfirmed = useRef(false)
  const decimalPlace = Math.min(decimals ?? 6, 6)
  const isApprovePanelShown = useAppSettings((s) => s.isApprovePanelShown)

  const confirm = useCallback(
    (close: () => void) => {
      onConfirm?.(close)
      hasConfirmed.current = true
    },
    [onClose]
  )

  const nftHasLoaded = Boolean(gettedNFTAddress)
  const nftThumbnail = 'https://cloudflare-ipfs.com/ipfs/Qme9ErqmQaznzpfDACncEW48NyXJPFP7HgzfoNdto9xQ9P/02.jpg'

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onClose={close}>
      {({ close }) => (
        <Card
          className={twMerge(
            `p-6 mobile:py-4 mobile:px-2 rounded-3xl w-[min(480px,95vw)] mx-8 border-1.5 border-[rgba(171,196,255,0.2)]  bg-cyberpunk-card-bg shadow-cyberpunk-card`
          )}
          size="lg"
        >
          {nftHasLoaded ? (
            <>
              <Row className="justify-between items-center mb-6 mobile:mb-3">
                <div className="text-xl font-semibold text-white mobile:text-base">Deposit Confirmed</div>
                <Icon className="text-[#ABC4FF] cursor-pointer" heroIconName="x" onClick={close} />
              </Row>
              <div className="my-4 mx-4 space-y-4">
                <div className="text-sm text-[#ABC4FF] font-medium">
                  A new NFT representing your Concentrated Liquidity position is now in your wallet.
                </div>
                <Col className="gap-2 items-center">
                  <Image src={nftThumbnail} className="h-44 w-44" />
                  <Row className="text-sm text-[#ABC4FF] font-medium gap-2">
                    <div>NFT Mint:</div>
                    <AddressItem canCopy canExternalLink addressType="token">
                      {gettedNFTAddress}
                    </AddressItem>
                  </Row>
                </Col>
                <div className="text-sm text-[#ABC4FF] font-medium">
                  <strong className="text-base">DO NOT</strong> burn this NFT or you will be unable to remove liquidity!
                  If you send the NFT to another wallet, only the new wallet will be able to remove liquidity.
                </div>
              </div>
              <Col className="items-center mt-5 mobile:mt-3">
                <div className="self-stretch">
                  <Col>
                    <Button className={`frosted-glass-teal`} onClick={onBackToAllMyPools}>
                      View My Pools
                    </Button>
                  </Col>
                </div>
              </Col>
            </>
          ) : (
            <>
              <Row className="justify-between items-center mb-6 mobile:mb-3">
                <div className="text-xl font-semibold text-white mobile:text-base">
                  Preview Deposit to {coin1?.symbol} / {coin2?.symbol}
                </div>
                <Icon className="text-[#ABC4FF] cursor-pointer" heroIconName="x" onClick={close} />
              </Row>
              <div className="mt-4 border-1.5 border-[#abc4ff40] rounded-xl p-3 mobile:p-2 mobile:mt-3">
                <span className="text-sm leading-[18px] text-secondary-title">My Position</span>
                <div className="text-sm flex leading-[18px] flex-col pt-2.5">
                  <div className="flex justify-between mb-2.5">
                    <span className="flex items-center text-sm text-[#abc4ff]">
                      <CoinAvatar className="inline-block mr-1" size="sm" token={coin1} />
                      {coin1?.symbol}
                    </span>
                    <Col className="items-end">
                      <span>
                        {toString(coin1Amount)} {coin1?.symbol}
                      </span>
                      {isMeaningfulNumber(coin1AmountFee) && (
                        <Row className="text-xs text-[#abc4ff80] gap-0.5 items-center">
                          <span>Position: {toString(minus(coin1Amount, coin1AmountFee))} + </span>
                          <Row className="text-[#D8CB39] font-medium gap-0.5 items-center">
                            <span>Fee</span>
                            <Tooltip>
                              <Icon size="xs" heroIconName="information-circle" />
                              <Tooltip.Panel>
                                <div className="max-w-[300px] space-y-1.5">
                                  This token uses the Token-2022 program and includes a transfer fee set by the token
                                  creator. These are the final deposit amounts for the position and the transfer fee.
                                </div>
                              </Tooltip.Panel>
                            </Tooltip>
                            <span>: {toString(coin1AmountFee)}</span>
                          </Row>
                        </Row>
                      )}
                    </Col>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center text-sm text-[#abc4ff]">
                      <CoinAvatar className="inline-block mr-1" size="sm" token={coin2} />
                      {coin2?.symbol}
                    </span>
                    <Col className="items-end">
                      <span>
                        {toString(coin2Amount)} {coin2?.symbol}
                      </span>
                      {isMeaningfulNumber(coin2AmountFee) && (
                        <Row className="text-xs text-[#abc4ff80] gap-0.5 items-center">
                          <span>Position: {toString(minus(coin2Amount, coin2AmountFee))} + </span>
                          <Row className="text-[#D8CB39] font-medium gap-0.5 items-center">
                            <span>Fee</span>
                            <Tooltip>
                              <Icon size="xs" heroIconName="information-circle" />
                              <Tooltip.Panel>
                                <div className="max-w-[300px] space-y-1.5">
                                  This token uses the Token-2022 program and includes a transfer fee set by the token
                                  creator. These are the final deposit amounts for the position and the transfer fee.
                                </div>
                              </Tooltip.Panel>
                            </Tooltip>
                            <span>: {toString(coin2AmountFee)}</span>
                          </Row>
                        </Row>
                      )}
                    </Col>
                  </div>
                  <div className="flex justify-between mt-2 pl-1">
                    <span className="flex items-center text-sm text-[#abc4ff]">Fee tier</span>
                    <span>{toPercentString((feeRate || 0) / 10 ** 6)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-1.5 border-[#abc4ff40] rounded-xl p-3 mobile:p-2 mobile:mt-3">
                <div className="text-sm flex justify-between items-end leading-[18px] font-medium mb-2 mobile:text-xs">
                  <span className="flex text-sm text-secondary-title leading-[18px] mr-2">Current Price</span>
                  {currentPrice ? shakeZero(toString(currentPrice, { decimalLength: decimalPlace })) : '0'}{' '}
                  {coin2?.symbol} per {coin1?.symbol}
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm leading-[18px] text-secondary-title">Selected Range</span>
                  <span>
                    {inRange ? (
                      <Row className="items-center bg-[#142B45] rounded text-xs text-[#39D0D8] py-0.5 px-1 ml-2">
                        <Icon size="xs" iconSrc={'/icons/check-circle.svg'} />
                        <div className="mobile:text-2xs font-normal" style={{ marginLeft: 4 }}>
                          In Range
                        </div>
                      </Row>
                    ) : (
                      <Row className="items-center bg-[#DA2EEF]/10 rounded text-xs text-[#DA2EEF] py-0.5 px-1 ml-2">
                        <Icon size="xs" iconSrc={'/icons/warn-stick.svg'} />
                        <div className="mobile:text-2xs font-normal" style={{ marginLeft: 4 }}>
                          Out of Range
                        </div>
                      </Row>
                    )}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="border-1.5 justify-center text-center flex-1 border-light-blue-opacity rounded-xl p-3 mobile:p-2">
                    <span className="text-sm leading-[18px] text-secondary-title">Min Price</span>
                    <div className="text-xl my-3">{toString(position?.min, { decimalLength: decimalPlace })}</div>
                    <div className="text-sm text-[#abc4ff80]">
                      {coin2?.symbol} per {coin1?.symbol}
                    </div>
                  </div>
                  <div className="border-1.5 justify-center text-center flex-1 border-light-blue-opacity rounded-xl p-3 mobile:p-2">
                    <span className="text-sm leading-[18px] text-secondary-title">Max Price</span>
                    <div className="text-xl my-3">{toString(position?.max, { decimalLength: decimalPlace })}</div>
                    <div className="text-sm text-[#abc4ff80]">
                      {coin2?.symbol} per {coin1?.symbol}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-1.5 border-[#abc4ff40] rounded-xl p-3 mobile:p-2 mobile:mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm leading-[18px] text-secondary-title">Total Deposit</span>
                  <span className="text-lg">{totalDeposit}</span>
                </div>
              </div>
              <Col className="items-center mt-5 mobile:mt-3">
                <div className="self-stretch">
                  <Col>
                    <Button
                      className={`frosted-glass-teal`}
                      isLoading={isApprovePanelShown}
                      validators={[
                        {
                          should: isSnapshotDataFresh,
                          forceActive: true,
                          fallbackProps: {
                            onClick: () => {
                              onRefreshSnapshot()
                            },
                            children: 'Refresh Position'
                          }
                        },
                        {
                          should: haveEnoughCoin1,
                          fallbackProps: { children: `Insufficient ${coin1?.symbol ?? ''} balance` }
                        },
                        {
                          should: haveEnoughCoin2,
                          fallbackProps: { children: `Insufficient ${coin2?.symbol ?? ''} balance` }
                        }
                      ]}
                      onClick={() => confirm(close)}
                    >
                      Confirm Deposit
                    </Button>
                  </Col>
                </div>
              </Col>
            </>
          )}
        </Card>
      )}
    </Dialog>
  )
}
