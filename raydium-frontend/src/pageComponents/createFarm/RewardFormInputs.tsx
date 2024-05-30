import useAppSettings from '@/application/common/useAppSettings'
import useConnection from '@/application/connection/useConnection'
import { getRewardSignature, hasRewardBeenEdited } from '@/application/createFarm/parseRewardInfo'
import { UIRewardInfo } from '@/application/createFarm/type'
import useCreateFarms from '@/application/createFarm/useCreateFarm'
import {
  MAX_DURATION_SECOND,
  MAX_OFFSET_AFTER_NOW_SECOND,
  MIN_DURATION_SECOND
} from '@/application/farms/handleFarmInfo'
import { isQuantumSOLVersionSOL, QuantumSOLVersionSOL, QuantumSOLVersionWSOL } from '@/application/token/quantumSOL'
import { SplToken } from '@/application/token/type'
import useWallet from '@/application/wallet/useWallet'
import AutoBox from '@/components/AutoBox'
import CoinInputBoxWithTokenSelector from '@/components/CoinInputBoxWithTokenSelector'
import Col from '@/components/Col'
import DateInput from '@/components/DateInput'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import InputBox from '@/components/InputBox'
import Row from '@/components/Row'
import SelectBox from '@/components/SelectBox'
import Tooltip from '@/components/Tooltip'
import { shakeUndifindedItem } from '@/functions/arrayMethods'
import { getTime, offsetDateTime } from '@/functions/date/dateFormat'
import { isDateAfter, isDateBefore } from '@/functions/date/judges'
import { getDuration, parseDurationAbsolute } from '@/functions/date/parseDuration'
import { isExist } from '@/functions/judgers/nil'
import { gte, isMeaningfulNumber, lt } from '@/functions/numberish/compare'
import { div, mul } from '@/functions/numberish/operations'
import { toString } from '@/functions/numberish/toString'
import { shrinkToValue } from '@/functions/shrinkToValue'
import { useRecordedEffect } from '@/hooks/useRecordedEffect'
import { MayFunction, Numberish } from '@/types/constants'
import { produce } from 'immer'
import { RefObject, useEffect, useImperativeHandle, useState } from 'react'

/**
 * if super preferential is not provide(undefined|null) it is normal useState
 * if super preferential is provide(not undefined|null) it is just value, and setState not work
 */
function useStateWithSuperPreferential<T>(
  superPreferential: MayFunction<T>
): [value: T, setState: React.Dispatch<React.SetStateAction<T>>] {
  const superValue = shrinkToValue(superPreferential)
  const [value, setValue] = useState(superValue)

  // if superValue comes to undefined, clear the state
  useRecordedEffect(
    ([prevSuperValue]) => {
      if (prevSuperValue != null && superValue == null) {
        setValue(superValue) // clear the state
      }
    },
    [superValue]
  )

  const doNothing = () => {}
  return [isExist(superValue) ? superValue : value, (isExist(superValue) ? doNothing : setValue) as any]
}

const HOUR_SECONDS = 60 * 60
const DAY_SECONDS = 24 * 60 * 60

export type RewardFormCardInputsParams = {
  reward: UIRewardInfo
  componentRef?: RefObject<any>
  syncDataWithZustandStore?: boolean
  maxDurationSeconds?: number /* only edit mode  seconds */
  minDurationSeconds?: number /* only edit mode  seconds */

  onRewardChange?: (reward: UIRewardInfo) => void
}

export type RewardCardInputsHandler = {
  tempReward: UIRewardInfo
  isValid: boolean
}

export function RewardFormCardInputs({
  reward: targetReward,
  syncDataWithZustandStore,
  minDurationSeconds = MIN_DURATION_SECOND,
  maxDurationSeconds = MAX_DURATION_SECOND,
  componentRef,

  onRewardChange
}: RewardFormCardInputsParams) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const getBalance = useWallet((s) => s.getBalance)
  const rewards = useCreateFarms((s) => s.rewards)
  const rewardIndex = rewards.findIndex(({ id }) => id === targetReward.id)
  const reward = rewards[rewardIndex] as UIRewardInfo | undefined // usdate fresh data

  //#region ------------------- reward center -------------------
  // to cache the result, have to store a temp
  const isUnedited72hReward = Boolean(reward && reward.isRwardingBeforeEnd72h && !hasRewardBeenEdited(reward))
  const isUneditedEndedReward = Boolean(reward?.isRewardEnded && !hasRewardBeenEdited(targetReward))
  const [tempReward, setTempReward] = useState(() =>
    isUneditedEndedReward
      ? { ...targetReward, amount: undefined, startTime: undefined, endTime: undefined }
      : isUnedited72hReward
      ? { ...targetReward, amount: undefined, startTime: targetReward.originData?.endTime, endTime: undefined }
      : targetReward
  )

  useEffect(() => {
    if (
      reward &&
      !reward?.isRewardEnded &&
      !reward?.isRewarding &&
      getRewardSignature(reward) !== getRewardSignature(tempReward)
    ) {
      setTempReward(reward)
    }
  }, [reward])

  const selectRewardToken = (token: SplToken | undefined) => {
    setTempReward(
      produce(tempReward, (draft) => {
        draft.token = token
      })
    )
    if (syncDataWithZustandStore) {
      useCreateFarms.setState({
        rewards: produce(rewards, (draft) => {
          if (rewardIndex >= 0) draft[rewardIndex].token = token
        })
      })
    }
  }
  const handleSwitchSOLWSOLRewardToken = () => {
    setTempReward(
      produce(tempReward, (draft) => {
        draft.token = isQuantumSOLVersionSOL(draft.token) ? QuantumSOLVersionWSOL : QuantumSOLVersionSOL
      })
    )
    if (syncDataWithZustandStore) {
      useCreateFarms.setState({
        rewards: produce(rewards, (draft) => {
          if (rewardIndex >= 0)
            draft[rewardIndex].token = isQuantumSOLVersionSOL(draft[rewardIndex].token)
              ? QuantumSOLVersionWSOL
              : QuantumSOLVersionSOL
        })
      })
    }
  }
  const setIsOptionToken = (on?: boolean) => {
    setTempReward((s) =>
      produce(s, (draft) => {
        draft.isOptionToken = on
      })
    )
    if (syncDataWithZustandStore) {
      useCreateFarms.setState({
        rewards: produce(rewards, (draft) => {
          if (rewardIndex >= 0) draft[rewardIndex].isOptionToken = on
        })
      })
    }
  }
  const setRewardAmount = (amount: Numberish | undefined) => {
    setTempReward((s) =>
      produce(s, (draft) => {
        draft.amount = amount
      })
    )
    if (syncDataWithZustandStore) {
      useCreateFarms.setState({
        rewards: produce(rewards, (draft) => {
          if (rewardIndex >= 0) draft[rewardIndex].amount = amount
        })
      })
    }
  }
  const setRewardTime = (date: { start?: Date; end?: Date }) => {
    setTempReward((s) =>
      produce(s, (draft) => {
        if (date.end) draft.endTime = date.end
        if (date.start) draft.startTime = date.start
      })
    )
    if (syncDataWithZustandStore) {
      setTimeout(() => {
        useCreateFarms.setState({
          rewards: produce(rewards, (draft) => {
            // immer can't be composed atom
            if (date.start) draft[rewardIndex].startTime = date.start
            if (date.end) draft[rewardIndex].endTime = date.end
          })
        })
      })
    }
  }

  useEffect(() => {
    if (!targetReward.amount && !targetReward.startTime && !targetReward.endTime) {
      setTempReward(targetReward)
    }
  }, [targetReward])

  //#endregion

  const [durationTime, setDurationTime] = useStateWithSuperPreferential(
    tempReward.endTime && tempReward.startTime ? getTime(tempReward.endTime) - getTime(tempReward.startTime) : undefined
  )

  // NOTE: only 'days' or 'hours'
  const durationBoundaryUnit = parseDurationAbsolute(maxDurationSeconds * 1000).days > 1 ? 'days' : 'hours'
  const minDurationValue = minDurationSeconds / (durationBoundaryUnit === 'hours' ? HOUR_SECONDS : DAY_SECONDS)
  const maxDurationValue = maxDurationSeconds / (durationBoundaryUnit === 'hours' ? HOUR_SECONDS : DAY_SECONDS)
  const estimatedValue =
    isUnedited72hReward && tempReward.originData?.perSecond
      ? mul(tempReward.originData.perSecond, 24 * 60 * 60)
      : tempReward.amount && durationTime
      ? div(tempReward.amount, parseDurationAbsolute(durationTime).days)
      : undefined

  const disableTokenSelect = reward?.isRewardBeforeStart || reward?.isRewarding || reward?.isRewardEnded
  const disableTokenTypeSelect = disableTokenSelect
  const disableCoinInput = reward?.isRwardingBeforeEnd72h
  const disableDurationInput = false
  const disableStartTimeInput = reward?.isRwardingBeforeEnd72h
  const disableEndTimeInput = !reward?.isRwardingBeforeEnd72h
  const disableEstimatedInput = reward?.isRwardingBeforeEnd72h

  const chainTimeOffset = useConnection((s) => s.chainTimeOffset) ?? 0
  const currentBlockChainDate = new Date(Date.now() + chainTimeOffset)

  const isStartTimeAfterCurrent = Boolean(
    tempReward && tempReward.startTime && isDateAfter(tempReward.startTime, currentBlockChainDate)
  )
  const isDurationValid = Boolean(
    durationTime != null && minDurationSeconds * 1e3 <= durationTime && durationTime <= maxDurationSeconds * 1e3
  )
  // const walletBalance =  balances[toPubString(tempReward.token?.mint)]
  const haveBalance = Boolean(tempReward.token && gte(getBalance(tempReward.token), tempReward.amount))
  const isAmountValid = haveBalance

  const rewardTokenAmount =
    tempReward && toString(tempReward.amount, { decimalLength: `auto ${tempReward.token?.decimals ?? 6}` })
  const rewardDuration = getDurationValueFromMilliseconds(durationTime, durationBoundaryUnit)
  const rewardStartTime = tempReward.startTime
  const rewardEndTime = tempReward.endTime
  const rewardEstimatedValue =
    estimatedValue && toString(estimatedValue, { decimalLength: `auto ${tempReward?.token?.decimals ?? 6}` })
  const isValid = isDurationValid && isAmountValid && (tempReward?.isRwardingBeforeEnd72h || isStartTimeAfterCurrent)
  useImperativeHandle<any, RewardCardInputsHandler>(componentRef, () => ({ isValid, tempReward }))

  //#region ------------------- data change callback -------------------

  useEffect(() => {
    onRewardChange?.(tempReward)
  }, [tempReward])

  //#endregion

  const [isInputDuration, setIsInputDuration] = useState(false)
  const [isInputAmount, setIsInputAmount] = useState(false)
  if (!reward) return null

  const needShowAlert = !isInputDuration && durationTime != null
  const minBoundary =
    reward.endTime && reward.startTime && reward.token
      ? div(getDuration(reward.endTime, reward.startTime) / 1000, 10 ** reward.token.decimals)
      : undefined

  const needShowAmountAlert = !isInputAmount && lt(reward.amount, minBoundary)
  return (
    <Grid className="gap-4">
      <Col>
        <Row className="gap-4 mobile:flex-col">
          <CoinInputBoxWithTokenSelector
            className={`rounded-md grow`}
            haveHalfButton
            hasPlaceholder
            topLeftLabel="Token"
            disableTokens={shakeUndifindedItem(rewards.map((r) => r.token))}
            canSelectQuantumSOL={Boolean(tempReward.token)}
            disabled={disableCoinInput}
            value={rewardTokenAmount ?? ''} // pass '' to clear the input
            token={tempReward.token}
            disableTokenSelect={disableTokenSelect}
            onSelectToken={selectRewardToken}
            onUserInput={(amount) => {
              setRewardAmount(amount)
              setIsInputAmount(true)
            }}
            onBlur={() => {
              setIsInputAmount(false)
            }}
            allowSOLWSOLSwitch
            onTryToSwitchSOLWSOL={handleSwitchSOLWSOLRewardToken}
          />
          <SelectBox
            disabled={disableTokenTypeSelect}
            inputBoxClassName="w-1/3 shrink-0 mobile:w-full rounded-md px-4"
            candidateValues={['Standard SPL', 'Option tokens']}
            value={reward.isOptionToken ? 'Option tokens' : 'Standard SPL'}
            label={
              <Row className="items-center">
                <div>Token Type</div>
                <Tooltip>
                  <Icon className="ml-1 cursor-help" size="sm" heroIconName="question-mark-circle" />
                  <Tooltip.Panel>
                    <div className="max-w-[300px]">
                      Most reward tokens are Standard SPL. Only select Options Token if the token is an option that must
                      be redeemed.
                    </div>
                  </Tooltip.Panel>
                </Tooltip>
              </Row>
            }
            onChange={(newSortKey) => {
              setIsOptionToken(newSortKey === 'Option tokens')
            }}
          />
        </Row>
        <>
          {reward.amount && needShowAmountAlert && (
            <div className="text-[#DA2EEF] text-right text-sm font-medium pt-2 px-2">
              Emission rewards is lower than min required
            </div>
          )}
        </>
      </Col>
      <div>
        <AutoBox is={isMobile ? 'Col' : 'Row'} className="gap-4">
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
            placeholder={`${minDurationValue} - ${maxDurationValue}`}
            value={rewardDuration}
            disabled={disableDurationInput}
            onBlur={(v) => {
              setIsInputDuration(false)
            }}
            suffix={
              <div className="font-medium text-sm text-[#abc4ff80]">
                {durationBoundaryUnit === 'hours' ? 'Hours' : 'Days'}
              </div>
            }
            onUserInput={(v) => {
              if (!v) return
              setIsInputDuration(true)
              const totalDuration = getDurationFromString(v, durationBoundaryUnit)
              setDurationTime(isMeaningfulNumber(totalDuration) ? totalDuration : undefined)
              if (totalDuration > 0) {
                const haveStartTime = Boolean(rewardStartTime)
                const haveEndTime = Boolean(rewardEndTime)

                // set end time
                if (haveStartTime) {
                  setRewardTime({
                    end: offsetDateTime(rewardStartTime, {
                      milliseconds: totalDuration
                    })
                  })
                }

                // set amount (only edit-in-rewarding)
                if (reward.isRwardingBeforeEnd72h) {
                  setRewardAmount(mul(estimatedValue, parseDurationAbsolute(totalDuration).days))
                }

                // set start time
                if (haveEndTime && !haveStartTime) {
                  const calculatedStartTime = offsetDateTime(tempReward.endTime, {
                    milliseconds: -totalDuration
                  })
                  if (isDateAfter(calculatedStartTime, Date.now())) {
                    setRewardTime({ start: calculatedStartTime })
                  }
                }
              }
            }}
          />

          <DateInput
            className="w-1/3 mobile:w-full rounded-md px-4"
            label="Farming Starts"
            inputProps={{
              placeholder: 'Select date and time',
              inputClassName: 'text-sm font-medium text-white placeholder:text-[#abc4ff50]'
            }}
            showTime={{ format: 'Select time: HH:mm UTC' }}
            value={rewardStartTime}
            disabled={disableStartTimeInput}
            disableDateBeforeCurrent
            isValidDate={(date) => {
              const isValid = isDateBefore(
                date,
                offsetDateTime(currentBlockChainDate, { seconds: MAX_OFFSET_AFTER_NOW_SECOND })
              )
              return isValid
            }}
            onDateChange={(selectedDate) => {
              if (!selectedDate) return

              // set start time
              // set end time (if exist durationTime)
              setRewardTime({
                start: selectedDate,
                end: durationTime ? offsetDateTime(selectedDate, { milliseconds: durationTime }) : undefined
              })
            }}
          />
          <DateInput
            className="shrink-0 w-1/3 mobile:w-full rounded-md px-4"
            label="Farming Ends"
            inputProps={{
              placeholder: disableEndTimeInput ? undefined : 'Select date and time',
              inputClassName: 'text-sm font-medium text-white placeholder:text-[#abc4ff50]'
            }}
            value={rewardEndTime}
            disabled={disableEndTimeInput}
            disableDateBeforeCurrent
            showTime={false}
            isValidDate={(date) => {
              const isStartTimeBeforeCurrent = rewardStartTime && isDateBefore(rewardStartTime, currentBlockChainDate)
              if (reward.isRewardEnded && isStartTimeBeforeCurrent) {
                const duration = Math.round(
                  parseDurationAbsolute(date.getTime() - currentBlockChainDate.getTime()).seconds
                )
                return minDurationSeconds <= duration
              } else {
                const duration = Math.round(
                  parseDurationAbsolute(date.getTime() - (rewardStartTime ?? currentBlockChainDate).getTime()).seconds
                )
                return minDurationSeconds <= duration && duration <= maxDurationSeconds
              }
            }}
            onDateChange={(selectedDate) => {
              if (!selectedDate) return

              const haveStartTime = Boolean(rewardStartTime)

              // set end time
              // set start time (if exist durationTime)
              setRewardTime({
                end: selectedDate,
                start:
                  durationTime && !haveStartTime
                    ? offsetDateTime(selectedDate, { milliseconds: -durationTime })
                    : undefined
              })

              // set amount (only edit-in-rewarding)
              if (reward.isRwardingBeforeEnd72h) {
                setRewardAmount(
                  mul(estimatedValue, parseDurationAbsolute(selectedDate.getTime() - rewardStartTime!.getTime()).days)
                )
              }

              // set duration days
              if (haveStartTime) {
                const durationSeconds = parseDurationAbsolute(
                  selectedDate.getTime() - rewardStartTime!.getTime()
                ).seconds
                if (durationSeconds < minDurationSeconds) {
                  if (reward.isRwardingBeforeEnd72h) {
                    setRewardTime({
                      end: offsetDateTime(rewardStartTime, { seconds: minDurationSeconds })
                    })
                  } else {
                    setRewardTime({
                      start: offsetDateTime(selectedDate, { seconds: -minDurationSeconds })
                    })
                  }
                  setDurationTime(minDurationSeconds)
                } else if (durationSeconds > maxDurationSeconds) {
                  setRewardTime({
                    end: offsetDateTime(selectedDate, {
                      seconds: -maxDurationSeconds
                    })
                  })
                  setDurationTime(maxDurationSeconds)
                } else {
                  setDurationTime(durationSeconds)
                }
              }
            }}
          />
        </AutoBox>
        {needShowAlert && (
          <div>
            {durationTime! > maxDurationSeconds * 1e3 ? (
              <div className="text-[#DA2EEF] text-sm font-medium pt-2 pl-2">
                Period is longer than max duration of {maxDurationValue} {durationBoundaryUnit}
              </div>
            ) : durationTime! < minDurationSeconds * 1e3 ? (
              <div className="text-[#DA2EEF] text-sm font-medium pt-2 pl-2">
                Period is shorter than min duration of {minDurationValue} {durationBoundaryUnit}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <InputBox
        disabled={disableEstimatedInput}
        decimalMode
        decimalCount={reward.token?.decimals ?? 6}
        className="rounded-md px-4 font-medium text-sm"
        inputClassName="text-white"
        label="Estimated rewards / day"
        value={rewardEstimatedValue}
        onUserInput={(v) => {
          if (!durationTime) return
          setRewardAmount(mul(parseDurationAbsolute(durationTime).days, v))
        }}
        suffix={
          isMeaningfulNumber(estimatedValue) ? (
            <div className="font-medium text-sm text-[#abc4ff80]">{reward.token?.symbol ?? '--'}</div>
          ) : undefined
        }
      />
    </Grid>
  )
}
function getDurationFromString(v: string, unit: 'hours' | 'days') {
  const value = v.trim() // noneed days and hours, but no need to change through
  const valueNumber = isFinite(Number(value)) ? Number(value) : undefined
  const dayNumber = unit === 'days' ? valueNumber : undefined
  const hourNumber = unit === 'hours' ? valueNumber : undefined
  const totalDuration = (dayNumber ?? 0) * 24 * 60 * 60 * 1000 + (hourNumber ?? 0) * 60 * 60 * 1000
  return totalDuration
}

function getDurationValueFromMilliseconds(duration: number | undefined, unit: 'hours' | 'days') {
  return duration ? Math.round(parseDurationAbsolute(duration)[unit]) : duration
}
