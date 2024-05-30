import { useEffect } from 'react'

import useToken from '@/application/token/useToken'
import { RAYMint } from '@/application/token/wellknownToken.config'

import { QuantumSOLVersionSOL } from '@/application/token/quantumSOL'
import { getURLQueryEntry } from '@/functions/dom/getURLQueryEntries'
import toPubString from '@/functions/format/toMintString'
import useLiquidity from './useLiquidity'

export default function useLiquidityInitCoinFiller() {
  const getToken = useToken((s) => s.getToken)
  useEffect(() => {
    setTimeout(() => {
      // NOTE this effect must later than ammid parser
      const { coin1, coin2, ammId } = useLiquidity.getState()
      const query = getURLQueryEntry()
      const isNotReady = Boolean(ammId && !coin1 && !coin2)
      if (isNotReady) return
      const queryHaveSetCoin = ['coin0', 'coin1', 'ammId'].some((i) => Object.keys(query).includes(i))
      const needFillCoin1 =
        !coin1 && !ammId && coin2?.mintString !== QuantumSOLVersionSOL.mintString && !queryHaveSetCoin
      if (needFillCoin1) {
        useLiquidity.setState({ coin1: QuantumSOLVersionSOL })
      }
      const needFillCoin2 = !coin2 && !ammId && coin1?.mintString !== toPubString(RAYMint) && !queryHaveSetCoin
      if (needFillCoin2) {
        useLiquidity.setState({ coin2: getToken(RAYMint) })
      }
    }, 100)
  }, [getToken])
}
