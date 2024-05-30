import { Numberish } from '@/types/constants'
import { Percent } from '@raydium-io/raydium-sdk'
import parseNumberInfo from '../numberish/parseNumberInfo'

/**
 * @example
 * toPercent(3.14) // => Percent { 314.00% }
 * toPercent(3.14, { alreadyDecimaled: true }) // => Percent {3.14%}
 */
export function toPercent(n: Numberish, options?: { /* usually used for backend data */ alreadyDecimaled?: boolean }) {
  const { numerator, denominator } = parseNumberInfo(n)
  return new Percent(numerator, options?.alreadyDecimaled ? denominator + '00' : denominator)
}
