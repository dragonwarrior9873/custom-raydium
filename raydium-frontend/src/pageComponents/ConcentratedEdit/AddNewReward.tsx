import { useEffect, useMemo, useRef, useState } from 'react'

import useAppSettings from '@/application/common/useAppSettings'
import useConnection from '@/application/connection/useConnection'
import { SplToken } from '@/application/token/type'
import useWallet from '@/application/wallet/useWallet'
import Card from '@/components/Card'
import CoinInputBoxWithTokenSelector from '@/components/CoinInputBoxWithTokenSelector'
import DateInput from '@/components/DateInput'
import Grid from '@/components/Grid'
import InputBox from '@/components/InputBox'
import Row from '@/components/Row'
import { getDate, offsetDateTime } from '@/functions/date/dateFormat'
import { isDateAfter, isDateBefore } from '@/functions/date/judges'
import { getDuration } from '@/functions/date/parseDuration'
import { gt, gte, isMeaningfulNumber, isMeaninglessNumber, lt } from '@/functions/numberish/compare'
import { trimTailingZero } from '@/functions/numberish/handleZero'
import { add, div, minus, mul } from '@/functions/numberish/operations'

import { DAY_SECONDS, MAX_DURATION, MIN_DURATION } from './utils'
import { Numberish } from '@/types/constants'
import { toString } from '@/functions/numberish/toString'

interface Props {
  dataIndex: number
  defaultData?: NewReward
  chainTimeOffset?: number
  disableTokens?: SplToken[]
  enableTokens?: SplToken[]
  onValidateChange: (idx: number, err?: string) => void
  onUpdateReward: (data: NewReward, rewardIdx: number) => void
}

export interface NewReward {
  token?: SplToken
  amount?: {
    /*  fee + pure */
    total?: Numberish
    /*  without fee */
    pure?: Numberish
    /* token 2022 may have fee */
    fee?: Numberish
  }
  duration?: string
  openTime?: Date
  endTime?: Date
  perWeek?: Numberish
  isWhiteListReward?: boolean
}

export default function AddNewReward(props: Props) {
  const { dataIndex, defaultData, enableTokens, disableTokens, onValidateChange, onUpdateReward } = props
  const isMobile = useAppSettings((s) => s.isMobile)
  const chainTimeOffset = useConnection((s) => s.chainTimeOffset)
  const getBalance = useWallet((s) => s.getBalance)
  const [newReward, setNewReward] = useState<NewReward>(defaultData || {})
  const indexRef = useRef(dataIndex)

  const hasInput = Object.keys(newReward).length > 0
  const currentBlockChainDate = new Date(Date.now() + (chainTimeOffset || 0))

  const minBoundary =
    newReward.openTime && newReward.endTime && newReward.token
      ? div(
          getDuration(newReward.endTime.valueOf(), newReward.openTime.valueOf()) / 1000,
          10 ** newReward.token.decimals
        )
      : undefined
  const noTokenError = !newReward.token ? 'Confirm reward token' : undefined
  const noAmountError = isMeaninglessNumber(newReward.amount?.pure)
    ? `Enter ${newReward.token?.symbol} token amount`
    : undefined

  const balanceError =
    !newReward.token ||
    !newReward.amount ||
    gte(getBalance(newReward.token), add(newReward.amount.pure, newReward.amount.fee ?? 0))
      ? undefined
      : `Insufficient ${newReward.token.symbol} balance`
  const needShowAmountAlert =
    newReward.amount && lt(newReward.amount.pure, minBoundary)
      ? 'Emission rewards is lower than min required'
      : undefined

  const topError = hasInput ? noTokenError || noAmountError || balanceError || needShowAmountAlert : undefined

  const timeError = useMemo(() => {
    if (!newReward.openTime || !newReward.duration) return 'Confirm emission time setup'
    if (gt(newReward.duration, MAX_DURATION)) return `Period is longer than max duration of ${MAX_DURATION} days`
    if (lt(newReward.duration, MIN_DURATION)) return `Period is shorter than min duration of ${MIN_DURATION} days`
    return undefined
  }, [newReward.duration, newReward.openTime])

  useEffect(() => {
    onValidateChange(dataIndex, noTokenError || noAmountError || balanceError || needShowAmountAlert || timeError)
  }, [
    noTokenError,
    noAmountError,
    timeError,
    needShowAmountAlert,
    balanceError,
    newReward.amount,
    onValidateChange,
    dataIndex
  ])

  useEffect(() => {
    if (!hasInput) return
    setNewReward((values) => {
      const decimals = values.token?.decimals ?? 6

      const perWeek =
        isMeaningfulNumber(values.amount?.pure) && isMeaningfulNumber(values.duration)
          ? trimTailingZero(mul(div(values.amount!.pure, values.duration), 7).toFixed(decimals))
          : '0'

      return {
        ...values,
        endTime:
          isMeaningfulNumber(values.openTime?.valueOf()) && isMeaningfulNumber(values.duration)
            ? offsetDateTime(values.openTime, {
                milliseconds: Number(values.duration) * DAY_SECONDS * 1000
              })
            : values.endTime,
        perWeek
      }
    })
  }, [newReward.duration, newReward.openTime, newReward.amount, hasInput])

  useEffect(() => {
    onUpdateReward(newReward, dataIndex)
  }, [onUpdateReward, newReward, dataIndex])

  useEffect(() => {
    if (indexRef.current !== dataIndex && defaultData) setNewReward(defaultData)
    indexRef.current = dataIndex
  }, [defaultData, dataIndex])

  return (
    <Card
      className={`p-4 mb-4 mobile:p-3 bg-cyberpunk-card-bg border-1.5 border-[rgba(171,196,255,0.2)] ${
        isMobile ? 'rounded-2xl' : 'rounded-3xl'
      }`}
      size="lg"
    >
      <Grid className="gap-4">
        <Row className="gap-4 mobile:flex-col">
          <CoinInputBoxWithTokenSelector
            className="rounded-md grow"
            haveHalfButton
            hasPlaceholder
            topLeftLabel="Token"
            enableTokens={enableTokens}
            disableTokens={disableTokens}
            value={(newReward.amount?.pure != null && toString(newReward.amount.pure)) || ''}
            token={newReward.token}
            onSelectToken={(token) =>
              setNewReward((values) => ({ ...values, token, isWhiteListReward: !!enableTokens }))
            }
            onUserInput={(totalAmount) => {
              setNewReward((r) => {
                const fee = r.amount?.fee ?? 0
                const pure = minus(totalAmount, fee)
                return { ...r, amount: { total: totalAmount, pure, fee } }
              })
            }}
            onCalculateTransferFee={(fee) => {
              setNewReward((r) => {
                const total = r.amount?.total ?? fee
                const pure = minus(total, fee)
                return { ...r, amount: { total, pure, fee } }
              })
            }}
          />
          <InputBox
            className="grow-2 rounded-md text-sm font-medium text-white px-4"
            inputClassName="placeholder:text-[#abc4ff50]"
            label="Duration"
            inputMode="numeric"
            inputHTMLProps={{
              min: 1,
              maxLength: 3,
              step: 1
            }}
            pattern={/^\d{0,5}$/}
            placeholder={`${MIN_DURATION} - ${MAX_DURATION}`}
            value={newReward.duration}
            suffix={<div className="font-medium text-sm text-[#abc4ff80]">Days</div>}
            onUserInput={(duration) => setNewReward((values) => ({ ...values, duration }))}
          />
        </Row>
        {topError ? <div className="text-[#DA2EEF] text-right text-sm font-medium px-2">{topError}</div> : null}
        <Row className="gap-3 mobile:flex-col">
          <DateInput
            className="flex-[3] mobile:w-full rounded-md px-4"
            label="Farming Starts"
            inputProps={{
              placeholder: 'Select date and time',
              inputClassName: 'text-sm font-medium text-white placeholder:text-[#abc4ff50]'
            }}
            showTime={{ format: 'Select time: HH:mm UTC' }}
            value={newReward.openTime ? getDate(newReward.openTime) : undefined}
            disableDateBeforeCurrent
            isValidDate={(date) => {
              return (
                isDateAfter(
                  date,
                  offsetDateTime(currentBlockChainDate, {
                    seconds: -DAY_SECONDS
                  })
                ) &&
                isDateBefore(
                  date,
                  offsetDateTime(newReward.openTime || currentBlockChainDate, {
                    seconds: MAX_DURATION * DAY_SECONDS
                  })
                )
              )
            }}
            onDateChange={(selectedDate) => {
              if (!selectedDate) return
              setNewReward((values) => ({ ...values, openTime: getDate(selectedDate) }))
            }}
          />
          <DateInput
            className="flex-[3] mobile:w-full rounded-md px-4"
            label="Farming Ends"
            inputProps={{
              placeholder: 'Select date and time',
              inputClassName: 'text-sm font-medium text-white placeholder:text-[#abc4ff50]'
            }}
            showTime={{ format: 'Select time: HH:mm UTC' }}
            value={newReward.endTime ? getDate(newReward.endTime) : undefined}
            disabled
            disableDateBeforeCurrent
          />
          <InputBox
            label="Estimated rewards / week"
            className="flex-[3]"
            onUserInput={(perWeek) => {
              const cacledAmountPure = mul(div(perWeek, 7), newReward.duration)

              setNewReward((values) => ({
                ...values,
                perWeek,
                amount: {
                  total: cacledAmountPure,
                  pure: cacledAmountPure,
                  fee: undefined
                }
              }))
            }}
            value={newReward.perWeek ? toString(newReward.perWeek) : ''}
          />
        </Row>
        <div>
          {hasInput && (
            <div>
              {gt(newReward.duration, MAX_DURATION) ? (
                <div className="text-[#DA2EEF] text-sm font-medium  pl-2">
                  Period is longer than max duration of {MAX_DURATION} days
                </div>
              ) : lt(newReward.duration, MIN_DURATION) ? (
                <div className="text-[#DA2EEF] text-sm font-medium pl-2">
                  Period is shorter than min duration of {MIN_DURATION} days
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Grid>
    </Card>
  )
}
