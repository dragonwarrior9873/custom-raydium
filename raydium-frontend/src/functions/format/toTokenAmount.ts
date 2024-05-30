import { getTokenProgramId } from '@/application/token/isToken2022'
import {
  QuantumSOLAmount,
  QuantumSOLToken,
  WSOLMint,
  isQuantumSOL,
  isQuantumSOLVersionSOL,
  toQuantumSolAmount
} from '@/application/token/quantumSOL'
import { HydratedTokenJsonInfo } from '@/application/token/type'
import parseNumberInfo from '@/functions/numberish/parseNumberInfo'
import toBN from '@/functions/numberish/toBN'
import { Numberish } from '@/types/constants'
import { Fraction, Token, TokenAmount } from '@raydium-io/raydium-sdk'
import BN from 'bn.js'
import { isToken } from '../judgers/dateType'
import toFraction from '../numberish/toFraction'

/**
 *
 * @param token
 * @param amount default amount is BN, (amount can already decimaled also)
 * @returns
 */
export function toTokenAmount(
  token: QuantumSOLToken,
  amount: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): QuantumSOLAmount
export function toTokenAmount(
  token: HydratedTokenJsonInfo | Token,
  amount: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): TokenAmount
export function toTokenAmount(
  token?: HydratedTokenJsonInfo | Token,
  amount?: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): TokenAmount | undefined
export function toTokenAmount(
  token?: HydratedTokenJsonInfo | Token | QuantumSOLToken,
  amount?: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): TokenAmount | QuantumSOLAmount | undefined {
  if (!token) return undefined
  const programId = getTokenProgramId(token)
  const parsedToken = isToken(token)
    ? token
    : new Token(programId, token.mint, token.decimals, token.symbol, token.name)

  const numberDetails = parseNumberInfo(amount)

  const amountBigNumber = toBN(
    options?.alreadyDecimaled
      ? new Fraction(numberDetails.numerator, numberDetails.denominator).mul(new BN(10).pow(toBN(parsedToken.decimals)))
      : amount
      ? toFraction(amount)
      : toFraction(0)
  )

  const iswsol =
    (isQuantumSOL(parsedToken) && parsedToken.collapseTo === 'wsol') ||
    (!isQuantumSOL(parsedToken) && String(token.mint) === String(WSOLMint))

  const issol = isQuantumSOL(parsedToken) || isQuantumSOLVersionSOL(parsedToken)

  if (iswsol && !options?.exact) {
    return toQuantumSolAmount({ wsolRawAmount: amountBigNumber })
  } else if (issol && !options?.exact) {
    return toQuantumSolAmount({ solRawAmount: amountBigNumber })
  } else {
    return new TokenAmount(parsedToken, amountBigNumber)
  }
}
