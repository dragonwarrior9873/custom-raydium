import jFetch from '@/functions/dom/jFetch'
import { ComputeBudgetConfig } from '@raydium-io/raydium-sdk'
import useAppSettings from '../common/useAppSettings'
import { SOL } from '../token/quantumSOL'
import { isNumber } from '@/functions/judgers/dateType'

interface SolanaFeeInfo {
  min: number
  max: number
  avg: number
  priorityTx: number
  nonVotes: number
  priorityRatio: number
  avgCuPerBlock: number
  blockspaceUsageRatio: number
}
type SolanaFeeInfoJson = {
  '1': SolanaFeeInfo
  '5': SolanaFeeInfo
  '15': SolanaFeeInfo
}

/**
 * increase SDK performance
 */
export async function getComputeBudgetConfig(): Promise<ComputeBudgetConfig | undefined> {
  const transactionPriority = useAppSettings.getState().transactionPriority

  if (isNumber(transactionPriority)) {
    return {
      units: 600000,
      microLamports: Math.ceil((transactionPriority * 10 ** SOL.decimals * 1000000) / 600000)
    } as ComputeBudgetConfig
  } else {
    //TODO: write on
    // transactionPriority: auto
    const json = await jFetch<SolanaFeeInfoJson>('https://solanacompass.com/api/fees', {
      cacheFreshTime: 5 * 60 * 1000
    })
    const { avg } = json?.[15] ?? {}
    if (!avg) return undefined // fetch error
    return {
      units: 600000,
      microLamports: Math.min(Math.ceil((avg * 1000000) / 600000), 25000)
    } as ComputeBudgetConfig
  }
}
