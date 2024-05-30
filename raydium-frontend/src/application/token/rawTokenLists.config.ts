import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import {
  RaydiumDevTokenListJsonFile,
  RaydiumTokenListJsonFile,
  TokenListConfigType,
  TokenListFetchConfigItem
} from './type'

export const getLiquidityMainnetListUrl = () => useAppAdvancedSettings.getState().apiUrls.uiPoolInfo
const getCustomTokenListUrl = () => '/custom-token-list.json'
const getRaydiumMainnetTokenListUrl = () => useAppAdvancedSettings.getState().apiUrls.tokenInfo
const getClmmPoolListUrl = () => useAppAdvancedSettings.getState().apiUrls.clmmPools

export const rawTokenListConfigs = [
  {
    url: getRaydiumMainnetTokenListUrl,
    type: TokenListConfigType.RAYDIUM_MAIN
  },
  {
    url: getLiquidityMainnetListUrl,
    type: TokenListConfigType.LIQUIDITY_V2 // this can compose lp token
  },
  {
    url: getClmmPoolListUrl,
    type: TokenListConfigType.LIQUIDITY_V3 // this can compose lp token
  }
] as TokenListFetchConfigItem[]

export function isRaydiumMainnetTokenListName(response: any, url: () => string): response is RaydiumTokenListJsonFile {
  return url() === getRaydiumMainnetTokenListUrl()
}

export function isRaydiumDevTokenListName(response: any, url: () => string): response is RaydiumDevTokenListJsonFile {
  return url() === getCustomTokenListUrl()
}
