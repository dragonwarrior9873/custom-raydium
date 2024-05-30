import { Token } from '@raydium-io/raydium-sdk'

import { HexAddress, SrcAddress } from '@/types/constants'

export enum TokenListConfigType {
  RAYDIUM_MAIN,
  RAYDIUM_DEV,
  LIQUIDITY_V2,
  LIQUIDITY_V3
}

export interface ApiTokenJson {
  symbol: string
  name: string
  mint: HexAddress
  decimals: number
  extensions: {
    coingeckoId?: string
    version?: 'TOKEN2022'
  }
  icon: string
  hasFreeze: 0 | 1
}

export interface TokenJson {
  symbol?: string
  name?: string
  mint: HexAddress
  decimals: number
  extensions?: {
    coingeckoId?: string
    version?: 'TOKEN2022'
  }
  icon?: string
  hasFreeze?: boolean
}

export type SplToken = Token & {
  icon?: SrcAddress
  /** 'sol' or mint. for `<TokenSelector>` */
  id: HexAddress
  mintString: HexAddress
  extensions?: {
    coingeckoId?: string
    website?: string
    whitepaper?: string
    version?: 'TOKEN2022'
  }
  userAdded?: boolean // only if token is added by user
  symbol?: string // overwrite type Currency readonly limit
  name?: string // overwrite type Currency readonly limit
  hasFreeze?: boolean
}

export type LpToken = Token & {
  isLp: true
  base: SplToken
  quote: SplToken
  icon: SrcAddress
  /** mint. for `<TokenSelector>`*/
  id: HexAddress
  mintString: HexAddress
  extensions: {
    coingeckoId?: string
    website?: string
    whitepaper?: string
    version?: 'TOKEN2022'
  }
}

export interface HydratedTokenJsonInfo {
  /** 'sol' or mint. for `<TokenSelector>` */
  id: string
  mint: string
  symbol: string
  decimals: number
  name: string

  hasFreeze?: boolean
  isLp: boolean
  official: boolean
  base?: Token
  quote?: Token
  icon: SrcAddress
  extensions: {
    coingeckoId?: string
    website?: string
    whitepaper?: string
    version?: 'TOKEN2022'
  }
}

export interface RaydiumTokenListJsonFile {
  official: TokenJson[]
  unOfficial: TokenJson[]
  blacklist: HexAddress[]
}

export interface RaydiumDevTokenListJsonFile {
  name: string
  timestamp: string
  tokens: TokenJson[]
}

export interface TokenList {
  url: SrcAddress
  name: string
  timestamp: string
  tokens: TokenJson[]
}

export interface TokenListFetchConfigItem {
  url: () => SrcAddress
  type: TokenListConfigType
}

export { Token, TokenAmount } from '@raydium-io/raydium-sdk'
