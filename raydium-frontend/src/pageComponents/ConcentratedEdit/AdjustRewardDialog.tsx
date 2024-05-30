import { useEffect, useMemo, useState } from 'react'

import { Fraction } from '@raydium-io/raydium-sdk'

import useAppSettings from '@/application/common/useAppSettings'
import { HydratedConcentratedInfo } from '@/application/concentrated/type'
import useToken from '@/application/token/useToken'
import useWallet from '@/application/wallet/useWallet'
import Button from '@/components/Button'
import Card from '@/components/Card'
import CoinInputBox from '@/components/CoinInputBox'
import Col from '@/components/Col'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import InputBox from '@/components/InputBox'
import ListTable from '@/components/ListTable'
import ResponsiveDialogDrawer from '@/components/ResponsiveDialogDrawer'
import Row from '@/components/Row'
import Tooltip from '@/components/Tooltip'
import { offsetDateTime, toUTC } from '@/functions/date/dateFormat'
import formatNumber from '@/functions/format/formatNumber'
import toPercentString from '@/functions/format/toPercentString'
import toTotalPrice from '@/functions/format/toTotalPrice'
import toUsdVolume from '@/functions/format/toUsdVolume'
import { gte, isMeaningfulNumber, lt, lte } from '@/functions/numberish/compare'
import { div, mul, plus } from '@/functions/numberish/operations'
import { Unpacked } from '@/types/generics'

import { UpdateData } from './AddMoreDialog'
import { DAY_SECONDS, MAX_DURATION, MIN_DURATION } from './utils'

interface Props {
  onClose: () => void
  onConfirm: (props: { rewardMint: string; data: UpdateData }) => void
  chainTimeOffset?: number
  disableEndTimeInput?: boolean
  defaultData?: UpdateData
  reward?: Unpacked<HydratedConcentratedInfo['rewardInfos']> & { apr: string; tvl: Fraction }
}

interface State {
  amount: string
  daysExtend: string
}

const ERROR_MSG = {
  DURATION: 'Time extended must be a minimum 7 days and maximum 90 days.',
  DECREASE_ERROR: 'Decreasing reward rate is permitted within 72 hrs of current farm end time. Try adding more tokens.',
  DECREASE: 'Decreasing the reward rate is permitted within 72 hours of current farm end time.'
}

export default function AdjustRewardDialog({ defaultData, reward, chainTimeOffset, onClose, onConfirm }: Props) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const tokenPrices = useToken((s) => s.tokenPrices)
  const [dirty, setDirty] = useState(!!defaultData)
  const onlineCurrentDate = Date.now() + (chainTimeOffset ?? 0)
  const [getBalance, walletConnected] = useWallet((s) => [s.getBalance, s.connected])
  const [values, setValues] = useState<State>({
    amount: '',
    daysExtend: ''
  })

  const { endTime, rewardToken, perSecond, apr, rewardPerWeek, tvl } = reward || {}
  const haveLoadData = Boolean(values.amount && values.daysExtend)

  const haveBalance = Boolean(rewardToken && gte(getBalance(rewardToken), values.amount))
  const rewardDecimals = rewardToken?.decimals ?? 6
  const remainSeconds = useMemo(() => Math.floor(((endTime || 0) - onlineCurrentDate) / 1000), [reward])

  const remainDays = Math.ceil(remainSeconds / DAY_SECONDS)
  const remainAmount = mul(div(perSecond?.toFixed(rewardDecimals) || 0, 10 ** rewardDecimals), remainSeconds)

  // planA: amount/dayExtended
  const newPerSecondA = div(values.amount || 0, mul(values.daysExtend || 0, DAY_SECONDS))
  // planB: (remain amount + amount)/(remain days + dayExtended)
  const newPerSecondB = div(
    plus(remainAmount, values.amount || 0),
    plus(remainSeconds, mul(values.daysExtend || 0, DAY_SECONDS))
  )
  // new per second = Math.min(planA, planB)
  const newPerSecond = lt(newPerSecondA, newPerSecondB) ? newPerSecondA : newPerSecondB
  const newPerWeek = mul(newPerSecond, DAY_SECONDS * 7)

  const isWithin72hrs = remainSeconds >= 0 && remainSeconds <= 3600 * 72
  const isDecreaseSpeed = reward
    ? lt(newPerSecond.toFixed(rewardDecimals), div(perSecond || 0, 10 ** rewardDecimals).toFixed(rewardDecimals))
    : false

  const isDaysSufficient =
    isMeaningfulNumber(values.daysExtend) &&
    gte(values.daysExtend, MIN_DURATION) &&
    lte(values.daysExtend, MAX_DURATION)
  let errMsg = ''
  if (dirty && !isDaysSufficient) {
    errMsg = ERROR_MSG.DURATION
  } else if (isDecreaseSpeed) {
    if (!isWithin72hrs) errMsg = ERROR_MSG.DECREASE_ERROR
    else errMsg = ERROR_MSG.DECREASE
  }

  useEffect(() => {
    if (!defaultData) return
    const { amount = '', daysExtend = '' } = defaultData || {}
    setValues({
      amount,
      daysExtend
    })
    return () => setValues({ amount: '', daysExtend: '' })
  }, [defaultData])

  return (
    <>
      <ResponsiveDialogDrawer placement="from-bottom" open={!!reward} onClose={onClose}>
        {({ close: closeDialog }) => (
          <Card
            className="p-8 mobile:p-4 rounded-3xl mobile:rounded-lg w-[min(698px,90vw)] max-h-[80vh] mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card"
            size="lg"
          >
            <Row className="justify-between items-center mb-6 mobile:mb-2">
              <div className="mobile:text-base text-xl font-semibold text-white">Adjust rewards</div>
              <Icon heroIconName="x" className="cursor-pointer" onClick={onClose} />
            </Row>
            <div className="max-h-[calc(80vh-200px)] pr-2 overflow-y-auto overflow-x-hidden">
              <div className="bg-[rgba(171,196,255,0.08)] text-secondary-title text-sm p-3 mb-5 rounded-xl">
                <span className="text-style-color-fuchsia">Please note:</span> You can add more tokens and/or extend the
                farming period. Any action that will decrease the reward rate can only be done within 72 hours of
                current farm end time, and the period must be extended by at least 7 days.
              </div>
              <div className="text-secondary-title text-sm mb-3">Current rewards period</div>
              <ListTable
                list={reward ? [reward] : []}
                type={isMobile ? 'item-card' : 'list-table'}
                className={isMobile ? 'gap-4' : ''}
                getItemKey={(r) => `${r.tokenMint.toBase58()}-${r.creator.toBase58()}`}
                labelMapper={[
                  {
                    label: 'Remaining amount',
                    cssGridItemWidth: '.7fr'
                  },
                  {
                    label: 'Farming ends'
                  },
                  {
                    label: 'Rate',
                    cssGridItemWidth: '1fr'
                  }
                ]}
                renderRowItem={({ label }) => {
                  if (label === 'Remaining amount') {
                    return (
                      <Grid className="gap-4 h-full">
                        {perSecond ? (
                          <Col className="grow gap-2 break-all justify-center text-xs">
                            <div className="text-white text-base">
                              {formatNumber(remainAmount, {
                                fractionLength: rewardDecimals
                              })}
                            </div>
                            <div>
                              {toUsdVolume(
                                toTotalPrice(
                                  mul(div(perSecond.toFixed(rewardDecimals), 10 ** rewardDecimals), remainSeconds),
                                  tokenPrices[String(rewardToken?.mint)]
                                )
                              )}
                            </div>
                          </Col>
                        ) : undefined}
                      </Grid>
                    )
                  }

                  if (label === 'Farming ends') {
                    return (
                      <Grid className="h-full">
                        {endTime ? (
                          <Col className="justify-center gap-2 text-xs">
                            <span className="text-white text-base">{toUTC(endTime)}</span>
                            <span>{remainDays}D remaining</span>
                          </Col>
                        ) : undefined}
                      </Grid>
                    )
                  }

                  if (label === 'Rate') {
                    return (
                      <Grid className="gap-4 h-full">
                        <Col className="grow justify-center text-xs gap-2">
                          <div className=" text-base">
                            <span className="text-white">{formatNumber(rewardPerWeek!)}&nbsp;</span>
                            {rewardToken?.symbol}
                            /week
                          </div>
                          {apr} APR
                        </Col>
                      </Grid>
                    )
                  }
                }}
              />
              <div className="flex items-center text-secondary-title text-sm mt-5 mb-3">
                Additional rewards adjustment
                <Tooltip>
                  <Icon iconClassName="ml-1" size="sm" heroIconName="question-mark-circle" />
                  <Tooltip.Panel>
                    <div className="max-w-[300px]">
                      Rewards entered below are in addition to rewards remaining in the current rewards period above.
                      Additional rewards will be deposited in the farm from your wallet balance and combined with
                      existing remaining rewards.
                    </div>
                  </Tooltip.Panel>
                </Tooltip>
              </div>
              <Row className="gap-4 mb-4">
                <CoinInputBox
                  className="py-2 flex-[2] border-none mobile:py-1 px-3 mobile:px-2 border-1.5 border-[#abc4ff40]"
                  value={values.amount}
                  haveHalfButton
                  haveCoinIcon
                  topLeftLabel="Asset"
                  onUserInput={(amount) => {
                    setValues((preValues) => ({ ...preValues, amount }))
                    setDirty(true)
                  }}
                  token={reward?.rewardToken}
                />
                <InputBox
                  label="Days Extended"
                  className="flex-[1] max-h-[88px]"
                  inputHTMLProps={{
                    min: 1,
                    maxLength: 3,
                    step: 1
                  }}
                  pattern={/^\d{0,5}$/}
                  placeholder="7-90"
                  suffix={<span className="text-[#abc4ff80] text-xs">Days</span>}
                  value={values.daysExtend}
                  onUserInput={(daysExtend) => {
                    setValues((preValues) => ({ ...preValues, daysExtend }))
                    setDirty(true)
                  }}
                />
              </Row>
              {errMsg && <div className="text-style-color-fuchsia mb-4">{errMsg}</div>}
              {haveLoadData && (
                <>
                  <div className="flex items-center text-secondary-title text-sm mb-3">
                    Updated rewards period
                    <Tooltip>
                      <Icon iconClassName="ml-1" size="sm" heroIconName="question-mark-circle" />
                      <Tooltip.Panel>
                        <div className="max-w-[300px]">
                          Updated rewards combines remaining current rewards and additional rewards entered above.
                          Calculations are for the adjusted farming period time and rewards rate.
                        </div>
                      </Tooltip.Panel>
                    </Tooltip>
                  </div>
                  <ListTable
                    list={reward && values.amount && values.daysExtend ? [reward] : []}
                    type={isMobile ? 'item-card' : 'list-table'}
                    className={isMobile ? 'gap-4' : ''}
                    getItemKey={(r) => `${r.tokenMint.toBase58()}-${r.creator.toBase58()}`}
                    labelMapper={[
                      {
                        label: 'Total amount',
                        cssGridItemWidth: '.7fr'
                      },
                      {
                        label: 'Farming ends'
                      },
                      {
                        label: 'Rate',
                        cssGridItemWidth: '1fr'
                      }
                    ]}
                    renderRowItem={({ label }) => {
                      const newApr =
                        values.amount || values.daysExtend
                          ? toPercentString(
                              div(
                                mul(
                                  mul(newPerSecond, 3600 * 24 * 365),
                                  rewardToken ? tokenPrices[rewardToken.mint.toBase58()] : 0
                                ),
                                tvl
                              )
                            )
                          : apr

                      if (label === 'Total amount') {
                        return (
                          <Grid className="gap-4 h-full">
                            {perSecond ? (
                              <Col className="grow gap-2 break-all justify-center text-xs">
                                <div className="text-white text-base">
                                  {formatNumber(
                                    isDecreaseSpeed
                                      ? plus(values.amount, mul(newPerSecond, remainSeconds)).toFixed(rewardDecimals)
                                      : plus(values.amount, remainAmount).toFixed(rewardDecimals),
                                    {
                                      fractionLength: rewardDecimals
                                    }
                                  )}
                                </div>
                                <div>
                                  {toUsdVolume(
                                    toTotalPrice(
                                      plus(values.amount, remainAmount).toFixed(rewardDecimals),
                                      tokenPrices[String(rewardToken?.mint)]
                                    )
                                  )}
                                </div>
                              </Col>
                            ) : undefined}
                          </Grid>
                        )
                      }

                      if (label === 'Farming ends') {
                        return (
                          <Grid className="h-full">
                            {endTime ? (
                              <Col className="justify-center gap-2 text-xs">
                                <span className="text-white text-base">
                                  {toUTC(offsetDateTime(endTime, { days: Number(values.daysExtend || '0') }))}
                                </span>
                                <span>{remainDays + Number(values.daysExtend || '0')}D in Total</span>
                              </Col>
                            ) : undefined}
                          </Grid>
                        )
                      }

                      if (label === 'Rate') {
                        return (
                          <Grid className="gap-4 h-full">
                            <Col className="grow justify-center text-xs gap-2">
                              <div className=" text-base">
                                <span className="text-white">{formatNumber(newPerWeek)}&nbsp;</span>
                                {rewardToken?.symbol}
                                /week
                              </div>
                              {newApr} APR
                            </Col>
                          </Grid>
                        )
                      }
                    }}
                  />
                </>
              )}
            </div>
            <Row className="justify-between items-center mt-10 mobile:mb-2">
              <Button
                className="frosted-glass-teal min-w-[120px]"
                validators={[
                  {
                    should: walletConnected,
                    forceActive: true,
                    fallbackProps: {
                      onClick: () => useAppSettings.setState({ isWalletSelectorShown: true }),
                      children: 'Connect wallet'
                    }
                  },
                  {
                    should: isMeaningfulNumber(values.amount),
                    fallbackProps: {
                      children: `Enter ${reward?.rewardToken?.symbol} token amount`
                    }
                  },
                  {
                    should: isDaysSufficient,
                    fallbackProps: {
                      children: 'Insufficient days extended'
                    }
                  },
                  {
                    should: errMsg !== ERROR_MSG.DECREASE_ERROR
                  },
                  {
                    should: haveBalance,
                    fallbackProps: {
                      children: `Insufficient ${reward?.rewardToken?.symbol} balance`
                    }
                  }
                ]}
                onClick={() => {
                  onConfirm({
                    rewardMint: reward?.rewardToken?.mint.toBase58() || '',
                    data: {
                      ...values,
                      openTime: onlineCurrentDate,
                      endTime: offsetDateTime(endTime, { days: Number(values.daysExtend) }).valueOf(),
                      perSecond: mul(newPerSecond, 10 ** rewardDecimals)
                    }
                  })
                  closeDialog()
                }}
              >
                Save
              </Button>
              <Button
                type="text"
                className="text-sm text-[#ABC4FF] frosted-glass-skygray min-w-[120px]"
                onClick={closeDialog}
              >
                Cancel
              </Button>
            </Row>
          </Card>
        )}
      </ResponsiveDialogDrawer>
    </>
  )
}
