import { Numberish } from '@/types/constants'

import { shakeFalsyItem } from '../arrayMethods'
import { isNumberish } from '../judgers/dateType'
import { isNullish } from '../judgers/nil'
import toBN from '../numberish/toBN'
import { toString } from '../numberish/toString'

import { TimeStamp } from './interface'
import { currentIsAfter } from './judges'

export type ParsedDurationInfo = Record<'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds' | 'full', number>

/**
 * @example
 * parseDuration(5 * 60 * 1000) // {full: 5 * 60 * 1000, minutes: 5, ...[others]:0 }
 */
export default function parseDuration(duration: number): ParsedDurationInfo {
  let diff = duration
  const values: ParsedDurationInfo = {
    full: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  }
  values.full = Math.max(Math.floor(diff), 0)
  values.days = Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0)
  diff -= values.days * (1000 * 60 * 60 * 24)
  values.hours = Math.max(Math.floor(diff / (1000 * 60 * 60)), 0)
  diff -= values.hours * (1000 * 60 * 60)
  values.minutes = Math.max(Math.floor(diff / (1000 * 60)), 0)
  diff -= values.minutes * (1000 * 60)
  values.seconds = Math.max(Math.floor(diff / 1000), 0)
  diff -= values.seconds * 1000
  values.milliseconds = Math.max(diff, 0)
  return values
}

/**
 * each time property includes full time
 * @example
 * parseDurationAbsolute(5 * 60 * 1000) // {full: 5 * 60 * 1000, day: 5/24/60, hour: 5/60  minutes: 5, secends: 5 * 60, milliseconds: 5 * 60 * 1000 }
 */
export function parseDurationAbsolute(duration: number): ParsedDurationInfo {
  return {
    full: duration,
    days: duration / 24 / 60 / 60 / 1000,
    hours: duration / 60 / 60 / 1000,
    minutes: duration / 60 / 1000,
    seconds: duration / 1000,
    milliseconds: duration
  }
}

export function getDuration(timestampA: TimeStamp, timestampB: TimeStamp): number {
  return new Date(timestampA).getTime() - new Date(timestampB).getTime()
}

/**
 *
 * @example
 * toDurationString(parseDuration(getTime() - new Date(2020, 0, 1))) // '65days '
 */
export function toDurationString(
  duration: ParsedDurationInfo,
  options?: {
    /**singular/plural label is the same */
    labelDays?: string
    labelHours?: string
    labelMinutes?: string
    labelSeconds?: string
    labelMilliseconds?: string

    showMilliseconds?: boolean
  }
): string {
  const labelDays = options?.labelDays ?? 'days'
  const labelDay = options?.labelDays ?? 'day'
  const durationDay = duration.days
    ? duration.days > 1
      ? `${duration.days}${labelDays}`
      : `${duration.days}${labelDay}`
    : null

  const labelHours = options?.labelHours ?? 'hours'
  const labelHour = options?.labelHours ?? 'hour'
  const durationHour = duration.hours
    ? duration.hours > 1
      ? `${duration.hours}${labelHours}`
      : `${duration.hours}${labelHour}`
    : null

  const labelMinutes = options?.labelMinutes ?? 'minutes'
  const labelMinute = options?.labelMinutes ?? 'minute'
  const durationMinute = duration.minutes
    ? duration.minutes > 1
      ? `${duration.minutes}${labelMinutes}`
      : `${duration.minutes}${labelMinute}`
    : null

  const labelSeconds = options?.labelSeconds ?? 'seconds'
  const labelSecond = options?.labelSeconds ?? 'second'
  const durationSecond = duration.seconds
    ? duration.seconds > 1
      ? `${duration.seconds}${labelSeconds}`
      : `${duration.seconds}${labelSecond}`
    : null

  const labelMilliseconds = options?.labelMilliseconds ?? 'milliseconds'
  const labelMillisecond = options?.labelMilliseconds ?? 'millisecond'
  const durationMillisecond = duration.milliseconds
    ? duration.milliseconds > 1
      ? `${duration.milliseconds}${labelMilliseconds}`
      : `${duration.milliseconds}${labelMillisecond}`
    : null

  return shakeFalsyItem([
    durationDay,
    durationHour,
    durationMinute,
    durationSecond,
    options?.showMilliseconds && durationMillisecond
  ]).join(' ')
}

/**
 * baseDate should be the date time in future
 * ex. baseDate is 2023-01-01 00:00:05, current date is 2022-12-31 00:00:03
 * output should 1D 0h 2m
 */
export function getCountDownTime(baseDate: Date | undefined): string {
  if (!baseDate || currentIsAfter(baseDate)) {
    return ''
  }

  let delta = Math.abs(getDuration(baseDate, new Date())) / 1000

  const days = Math.floor(delta / 86400)
  delta -= days * 86400

  const hours = Math.floor(delta / 3600) % 24
  delta -= hours * 3600

  const minutes = Math.floor(delta / 60) % 60
  delta -= minutes * 60

  // if needs in the future
  // const seconds = delta % 60

  return `${days}D ${hours}h ${minutes}m`
}
