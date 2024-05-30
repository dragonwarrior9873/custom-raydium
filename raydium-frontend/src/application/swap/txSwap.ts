import { forecastTransactionSize, InnerSimpleTransaction, InstructionType, TradeV2 } from '@raydium-io/raydium-sdk'
import { ComputeBudgetProgram, SignatureResult, TransactionInstruction } from '@solana/web3.js'

import assert from '@/functions/assert'
import { toTokenAmount } from '@/functions/format/toTokenAmount'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { gt } from '@/functions/numberish/compare'
import { toString } from '@/functions/numberish/toString'

import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import { TxHistoryInfo } from '../txHistory/useTxHistory'
import { getComputeBudgetConfig } from '../txTools/getComputeBudgetConfig'
import txHandler, { lookupTableCache, TransactionQueue } from '../txTools/handleTx'
import useWallet from '../wallet/useWallet'

import { useSwap } from './useSwap'

export default async function txSwap() {
  const { programIds } = useAppAdvancedSettings.getState()
  const { checkWalletHasEnoughBalance, tokenAccountRawInfos, txVersion } = useWallet.getState()
  const {
    coin1,
    coin2,
    coin1Amount,
    coin2Amount,
    selectedCalcResult,

    focusSide,
    routeType,
    directionReversed,
    minReceived,
    maxSpent
  } = useSwap.getState()

  const upCoin = directionReversed ? coin2 : coin1
  // although info is included in routes, still need upCoinAmount to pop friendly feedback
  const upCoinAmount = (directionReversed ? coin2Amount : coin1Amount) || '0'

  const downCoin = directionReversed ? coin1 : coin2
  // although info is included in routes, still need downCoinAmount to pop friendly feedback
  const downCoinAmount = (directionReversed ? coin1Amount : coin2Amount) || '0'

  assert(upCoinAmount && gt(upCoinAmount, 0), 'should input upCoin amount larger than 0')
  assert(downCoinAmount && gt(downCoinAmount, 0), 'should input downCoin amount larger than 0')
  assert(upCoin, 'select a coin in upper box')
  assert(downCoin, 'select a coin in lower box')
  assert(!isMintEqual(upCoin.mint, downCoin.mint), 'should not select same mint ')
  assert(selectedCalcResult, "can't find correct route")

  const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
  const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true })

  assert(checkWalletHasEnoughBalance(upCoinTokenAmount), `not enough ${upCoin.symbol}`)
  assert(routeType, 'accidently routeType is undefined')

  // // check token 2022
  // const needConfirm = [coin1, coin2].some((i) => isToken2022(i))
  // let userHasConfirmed: boolean
  // if (needConfirm) {
  //   const { hasConfirmed } = openToken2022SwapConfirmPanel({
  //     routInfo: selectedCalcResult
  //   })
  //   // const { hasConfirmed } = openToken2022ClmmHavestConfirmPanel({ ammPool: currentAmmPool, onlyMints: [rewardInfo] })
  //   userHasConfirmed = await hasConfirmed
  // } else {
  //   userHasConfirmed = true
  // }
  // if (!userHasConfirmed) {
  //   useNotification.getState().logError('Canceled by User', 'The operation is canceled by user')
  //   return
  // }

  return txHandler(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const addComputeUnitLimitIns = ComputeBudgetProgram.setComputeUnitLimit({ units: 400001 })
    const { innerTransactions } = await TradeV2.makeSwapInstructionSimple({
      connection,
      swapInfo: selectedCalcResult,
      ownerInfo: {
        wallet: owner,
        tokenAccounts: tokenAccountRawInfos,
        associatedOnly: true,
        checkCreateATAOwner: true
      },
      routeProgram: programIds.Router,
      lookupTableCache,
      makeTxVersion: txVersion,
      computeBudgetConfig: await getComputeBudgetConfig()
    })

    // temp fix
    for (let i = 0; i < innerTransactions.length; i++) {
      if (
        innerTransactions[i].instructions[0].programId.toString() !== addComputeUnitLimitIns.programId.toString() &&
        forecastTransactionSize([addComputeUnitLimitIns, ...innerTransactions[i].instructions], [owner])
      ) {
        innerTransactions[i].instructions = [addComputeUnitLimitIns, ...innerTransactions[i].instructions].map(
          (i) =>
            new TransactionInstruction({
              programId: i.programId,
              data: i.data,
              keys: i.keys.map((ii) =>
                ii.pubkey.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' ? { ...ii, pubkey: owner } : ii
              )
            })
        )
      }
    }

    const queue = innerTransactions.map((tx, idx, allTxs) => [
      tx,
      {
        onTxError({ signatureResult, changeHistoryInfo }) {
          if (checkSwapSlippageError(signatureResult)) {
            changeHistoryInfo?.({
              forceErrorTitle: 'Swap failed due to slippage error!',
              description: 'Slippage has exceeded user settings.\nTry again or adjust your slippage tolerance.'
            })
          }
        },
        txHistoryInfo: {
          title: 'Swap',
          description: `Swap ${toString(upCoinAmount)} ${upCoin.symbol} to ${toString(minReceived || maxSpent)} ${
            downCoin.symbol
          }`,
          subtransactionDescription: translationSwapTxDescription(tx, idx, allTxs)
        } as TxHistoryInfo
      }
    ]) as TransactionQueue
    transactionCollector.add(queue, { sendMode: 'queue(all-settle)' })
  })
}

function translationSwapTxDescription(tx: InnerSimpleTransaction, idx: number, allTxs: InnerSimpleTransaction[]) {
  const swapFirstIdx = allTxs.findIndex((tx) => isSwapTransaction(tx))
  const swapLastIdx = allTxs.length - 1 - [...allTxs].reverse().findIndex((tx) => isSwapTransaction(tx))
  return idx < swapFirstIdx ? 'Setup' : idx > swapLastIdx ? 'Cleanup' : 'Swap'
}

function isSwapTransaction(tx: InnerSimpleTransaction): boolean {
  return (
    tx.instructionTypes.includes(InstructionType.clmmSwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.clmmSwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.ammV4Swap) ||
    tx.instructionTypes.includes(InstructionType.ammV4SwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.ammV4SwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.ammV5SwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.ammV5SwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.routeSwap1) ||
    tx.instructionTypes.includes(InstructionType.routeSwap2) ||
    tx.instructionTypes.includes(InstructionType.routeSwap)
  )
}

/**
 * @author RUDY
 */
function checkSwapSlippageError(err: SignatureResult): boolean {
  try {
    // @ts-expect-error force
    const coustom = err.err?.InstructionError[1].Custom
    if ([38, 6022].includes(coustom)) {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}
