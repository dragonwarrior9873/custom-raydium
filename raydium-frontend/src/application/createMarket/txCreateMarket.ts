import { MarketV2 } from '@raydium-io/raydium-sdk'

import assert from '@/functions/assert'
import toPubString, { toPub } from '@/functions/format/toMintString'
import { toString } from '@/functions/numberish/toString'
import { createTxHandler, lookupTableCache } from '../txTools/handleTx'
import { useCreateMarket } from './useCreateMarket'
import useWallet from '../wallet/useWallet'

const txCreateMarket = createTxHandler(() => async ({ transactionCollector, baseUtils: { connection, owner } }) => {
  const { programId, baseToken, quoteToken, minimumOrderSize, tickSize } = useCreateMarket.getState()
  const { txVersion } = useWallet.getState()
  assert(baseToken, 'please select a base token')
  assert(quoteToken, 'please select a quote token')

  // throw 'not imply yet'

  const { innerTransactions, address } = await MarketV2.makeCreateMarketInstructionSimple({
    connection,
    dexProgramId: toPub(programId),
    baseInfo: {
      mint: baseToken.mint,
      decimals: baseToken.decimals
    },
    quoteInfo: {
      mint: quoteToken.mint,
      decimals: quoteToken.decimals
    },
    lotSize: Number.parseFloat(toString(minimumOrderSize)),
    tickSize: Number.parseFloat(toString(tickSize)),
    wallet: owner,
    makeTxVersion: txVersion,
    lookupTableCache
  })

  transactionCollector.add(innerTransactions, {
    txHistoryInfo: {
      title: 'Create Market',
      description: `created new Market: ${toPubString(address['marketId'] /* SDK force, no type export */).slice(
        0,
        6
      )}...`
    },
    onTxAllSuccess() {
      useCreateMarket.setState({ newCreatedMarketId: address.marketId })
    }
  })
})

export default txCreateMarket
