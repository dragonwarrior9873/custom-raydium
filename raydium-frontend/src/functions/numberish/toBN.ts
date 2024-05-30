import BN from 'bn.js'
import { BigNumberish, TEN } from '@raydium-io/raydium-sdk'

import { Numberish } from '@/types/constants'

import { shakeFractionDecimal } from './shakeFractionDecimal'
import toFraction from './toFraction'

/**
 * only int part will become BN
 */
export default function toBN(n: undefined): undefined
export default function toBN(n: Numberish, decimal?: BigNumberish, roundDirection?: 'up' | 'down'): BN
export default function toBN(
  n: Numberish | undefined,
  decimal?: BigNumberish,
  roundDirection?: 'up' | 'down'
): BN | undefined
export default function toBN(
  n: Numberish | undefined,
  decimal: BigNumberish = 0,
  roundDirection?: 'up' | 'down'
): BN | undefined {
  if (n == null) return undefined
  if (n instanceof BN) return n
  return new BN(shakeFractionDecimal(toFraction(n).mul(TEN.pow(new BN(String(decimal)))), roundDirection))
}
