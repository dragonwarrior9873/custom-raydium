import { Connection } from '@solana/web3.js'

import { Farm } from '@raydium-io/raydium-sdk'

import txHandler, { SingleTxOption, lookupTableCache } from '@/application/txTools/handleTx'
import assert from '@/functions/assert'
import asyncMap from '@/functions/asyncMap'
import toPubString from '@/functions/format/toMintString'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { MayArray } from '@/types/constants'

import { HydratedFarmInfo } from '../farms/type'
import useFarms from '../farms/useFarms'
import { isQuantumSOLVersionSOL } from '../token/quantumSOL'
import { SOLMint } from '../token/wellknownToken.config'
import { jsonInfo2PoolKeys } from '../txTools/jsonInfo2PoolKeys'
import useWallet from '../wallet/useWallet'

import { UIRewardInfo } from './type'
import useCreateFarms from './useCreateFarm'

export default async function txClaimReward({
  reward,
  ...txAddOptions
}: { reward: MayArray<UIRewardInfo> } & SingleTxOption) {
  return txHandler(async ({ transactionCollector, baseUtils: { connection } }) => {
    // ---------- generate basic info ----------
    const { hydratedInfos } = useFarms.getState()
    const { farmId: targetFarmId } = useCreateFarms.getState()
    assert(targetFarmId, 'target farm id is missing')
    const farmInfo = hydratedInfos.find((f) => toPubString(f.id) === targetFarmId)
    assert(farmInfo, "can't find target farm")

    // ---------- claim reward ----------
    const innerTransactions = (
      await asyncMap([reward].flat(), (reward) => createClaimRewardInstruction({ reward, farmInfo, connection }))
    ).flat()

    transactionCollector.add(innerTransactions, {
      ...txAddOptions,
      txHistoryInfo: {
        title: 'Claim Reward',
        description: '(Click to see details)'
      }
    })
  })
}

async function createClaimRewardInstruction({
  connection,
  reward,
  farmInfo
}: {
  connection: Connection
  reward: UIRewardInfo
  farmInfo: HydratedFarmInfo
}) {
  const { owner, tokenAccountRawInfos, txVersion } = useWallet.getState()
  assert(owner, `Wallet not connected`)
  assert(isMintEqual(owner, reward.owner), `reward is not created by walletOwner`)
  assert(reward.token, `reward token haven't set`)

  const { innerTransactions } = await Farm.makeCreatorWithdrawFarmRewardInstructionSimple({
    connection,
    poolKeys: jsonInfo2PoolKeys(farmInfo.jsonInfo),
    userKeys: {
      tokenAccounts: tokenAccountRawInfos,
      owner
    },
    withdrawMint: isQuantumSOLVersionSOL(reward.token) ? SOLMint : reward.token?.mint,
    makeTxVersion: txVersion,
    lookupTableCache
  })

  assert(innerTransactions, 'withdraw farm valid failed')
  return innerTransactions
}
