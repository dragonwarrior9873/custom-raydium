import { Clmm } from '@raydium-io/raydium-sdk'

import assert from '@/functions/assert'
import toPubString from '@/functions/format/toMintString'
import { toTokenAmount } from '@/functions/format/toTokenAmount'
import { eq } from '@/functions/numberish/compare'
import toBN from '@/functions/numberish/toBN'
import { toString } from '@/functions/numberish/toString'
import { getTransferFeeInfo } from '../token/getTransferFeeInfos'
import { isToken2022 } from '../token/isToken2022'
import { getComputeBudgetConfig } from '../txTools/getComputeBudgetConfig'
import txHandler, { lookupTableCache } from '../txTools/handleTx'
import useWallet from '../wallet/useWallet'
import useConcentrated from './useConcentrated'

export default async function txDecreaseConcentrated(options?: { closePosition?: boolean }) {
  const {
    coin1,
    coin2,
    liquidity,
    targetUserPositionAccount,
    currentAmmPool,
    coin1Amount,
    coin2Amount,
    coin1AmountMin,
    coin2AmountMin
  } = useConcentrated.getState()
  const { tokenAccountRawInfos, txVersion } = useWallet.getState()
  assert(currentAmmPool, 'not seleted amm pool')
  assert(coin1, 'not set coin1')
  assert(coin2, 'not set coin2')
  assert(liquidity != null, 'not set liquidity')
  assert(targetUserPositionAccount, 'not set targetUserPositionAccount')

  const tokenAmount1 = toTokenAmount(coin1, coin1AmountMin, { alreadyDecimaled: true })
  const feeInfo1 = isToken2022(coin1) ? getTransferFeeInfo({ amount: tokenAmount1 }) : undefined

  const tokenAmount2 = toTokenAmount(coin2, coin2AmountMin, { alreadyDecimaled: true })
  const feeInfo2 = isToken2022(coin2) ? getTransferFeeInfo({ amount: tokenAmount2 }) : undefined

  return txHandler(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const [feeInfoA, feeInfoB] = await Promise.all([feeInfo1, feeInfo2])
    if (options?.closePosition) {
      const { innerTransactions } = await Clmm.makeCLosePositionInstructionSimple({
        connection: connection,
        poolInfo: currentAmmPool.state,
        ownerInfo: {
          feePayer: owner,
          wallet: owner
        },
        ownerPosition: targetUserPositionAccount.sdkParsed,
        makeTxVersion: txVersion,
        lookupTableCache
      })
      transactionCollector.add(innerTransactions, {
        txHistoryInfo: {
          title: 'Position Closed',
          description: `close ${toPubString(targetUserPositionAccount.poolId).slice(0, 6)} position`
        }
      })
    } else {
      assert(coin1AmountMin, 'not set coin1AmountMin')
      assert(coin2AmountMin, 'not set coin2AmountMin')
      const { innerTransactions } = await Clmm.makeDecreaseLiquidityInstructionSimple({
        connection: connection,
        liquidity,
        poolInfo: currentAmmPool.state,
        ownerInfo: {
          feePayer: owner,
          wallet: owner,
          tokenAccounts: tokenAccountRawInfos,
          useSOLBalance: true,
          closePosition: eq(targetUserPositionAccount.sdkParsed.liquidity, liquidity)
        },
        amountMinA: toBN(feeInfoA?.pure ?? coin1AmountMin, coin1.decimals),
        amountMinB: toBN(feeInfoB?.pure ?? coin2AmountMin, coin2.decimals),
        // slippage: Number(toString(slippageTolerance)),
        ownerPosition: targetUserPositionAccount.sdkParsed,
        computeBudgetConfig: await getComputeBudgetConfig(),
        checkCreateATAOwner: true,
        makeTxVersion: txVersion,
        lookupTableCache
      })
      transactionCollector.add(innerTransactions, {
        txHistoryInfo: {
          title: 'Liquidity Removed',
          description: `Removed ${toString(feeInfoA?.pure ?? coin1AmountMin, { decimalLength: 6 })} ${
            coin1.symbol
          } and ${toString(feeInfoB?.pure ?? coin2AmountMin, { decimalLength: 6 })} ${coin2.symbol} from ${toPubString(
            targetUserPositionAccount.poolId
          ).slice(0, 6)}`
        }
      })
    }
  })
}
