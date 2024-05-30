import toPubString from '@/functions/format/toMintString'
import { eq } from '@/functions/numberish/compare'
import { useEffect } from 'react'
import useConcentrated from './useConcentrated'

export default function useConcentratedCreateInitFeeSelector() {
  const coin1 = useConcentrated((s) => s.coin1)
  const coin2 = useConcentrated((s) => s.coin2)

  const existAmmPools = useConcentrated((s) => s.selectableAmmPools)
  const existAmmPoolConfigIds = existAmmPools?.map((i) => toPubString(i.ammConfig.id))
  const ammConfigFeeOptions = useConcentrated((s) => s.availableAmmConfigFeeOptions)

  // target
  const selectableAmmConfigs = ammConfigFeeOptions?.filter(
    (ammConfigFeeOption) => !existAmmPoolConfigIds?.includes(ammConfigFeeOption.id)
  )

  const ammConfigSignature = selectableAmmConfigs?.map((i) => i.id).join('_') // just for react useEffect dependence list
  useEffect(() => {
    if (!selectableAmmConfigs || !coin1 || !coin2) {
      useConcentrated.setState({ userSelectedAmmConfigFeeOption: undefined })
    } else {
      const defaultFeeOption = selectableAmmConfigs.find((config) => eq(config.tradeFeeRate, 0.0025))
      useConcentrated.setState({ userSelectedAmmConfigFeeOption: defaultFeeOption })
    }
  }, [ammConfigSignature, coin1, coin2])
}
