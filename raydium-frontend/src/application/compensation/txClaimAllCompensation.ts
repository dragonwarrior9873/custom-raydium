import { Utils1216 } from '@raydium-io/raydium-sdk'

import assert from '@/functions/assert'

import { TxHistoryInfo } from '../txHistory/useTxHistory'
import { createTxHandler, lookupTableCache, TransactionQueue } from '../txTools/handleTx'

import useWallet from '../wallet/useWallet'
import { HydratedCompensationInfoItem } from './type'
import { useCompensationMoney } from './useCompensation'

export const txClaimAllCompensation = createTxHandler(
  ({ poolInfos }: { poolInfos?: HydratedCompensationInfoItem[] } = {}) =>
    async ({ transactionCollector, baseUtils: { connection, owner } }) => {
      const { tokenAccountRawInfos, txVersion } = useWallet.getState()
      assert(poolInfos)

      const { innerTransactions } = await Utils1216.makeClaimAllInstructionSimple({
        connection,
        poolInfos: poolInfos.map((poolInfo) => poolInfo.rawInfo),
        ownerInfo: {
          wallet: owner,
          tokenAccounts: tokenAccountRawInfos,
          associatedOnly: true,
          checkCreateATAOwner: true
        },
        lookupTableCache,
        makeTxVersion: txVersion
      })

      const queue = innerTransactions.map((tx) => [
        tx,
        {
          txHistoryInfo: { title: 'Claim' } as TxHistoryInfo
        }
      ]) as TransactionQueue

      transactionCollector.add(queue, {
        onTxAllSuccess() {
          useCompensationMoney.getState().refresh()
        }
      })
    }
)
