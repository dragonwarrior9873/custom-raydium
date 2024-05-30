import { CurrencyAmount, Fraction, Percent, Price, TokenAmount, ZERO } from '@raydium-io/raydium-sdk'

import { SOLDecimals } from '@/application/token/quantumSOL'
import parseNumberInfo from '@/functions/numberish/parseNumberInfo'
import { Numberish } from '@/types/constants'

import tryCatch from '../tryCatch'

export default function toFraction(value: Numberish): Fraction {
  //  to complete math format(may have decimal), not int
  if (value instanceof Percent) return new Fraction(value.numerator, value.denominator)

  if (value instanceof Price) return value.adjusted

  // to complete math format(may have decimal), not BN
  if (value instanceof CurrencyAmount)
    return tryCatch(
      () => toFraction(value.toExact()),
      () => new Fraction(ZERO)
    )

  // do not ideal with other fraction value
  if (value instanceof Fraction) return value

  // wrap to Fraction
  const n = String(value)
  const details = parseNumberInfo(n)
  return new Fraction(details.numerator, details.denominator)
}

export function toFractionWithDecimals(value: Numberish): { fr: Fraction; decimals?: number } {
  //  to complete math format(may have decimal), not int
  if (value instanceof Percent) return { fr: new Fraction(value.numerator, value.denominator) }

  if (value instanceof Price) return { fr: value.adjusted }

  // to complete math format(may have decimal), not BN
  if (value instanceof CurrencyAmount)
    return {
      fr: toFraction(value.toExact()),
      decimals: value instanceof TokenAmount ? value.token.decimals : SOLDecimals
    }

  // do not ideal with other fraction value
  if (value instanceof Fraction) return { fr: value }

  // wrap to Fraction
  const n = String(value)
  const details = parseNumberInfo(n)
  return { fr: new Fraction(details.numerator, details.denominator), decimals: details.dec?.length }
}
