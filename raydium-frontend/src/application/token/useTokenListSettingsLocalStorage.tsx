import { useEffect } from 'react'

import { SplTokenJsonInfo } from '@raydium-io/raydium-sdk'

import { shakeUndifindedItem } from '@/functions/arrayMethods'
import { getLocalItem, setLocalItem } from '@/functions/dom/jStorage'
import listToMap from '@/functions/format/listToMap'
import toPubString from '@/functions/format/toMintString'
import { objectMap } from '@/functions/objectMethods'
import useAsyncEffect from '@/hooks/useAsyncEffect'

import useConnection from '../connection/useConnection'

import { getTokenFromLocalStorage } from './getTokenFromLocalStorage'
import { SOLANA_TOKEN_LIST_NAME, USER_ADDED_TOKEN_LIST_NAME, useToken } from './useToken'

export default function useTokenListSettingsLocalStorage() {
  const refreshTokenListCount = useToken((s) => s.refreshTokenListCount)
  const connection = useConnection((s) => s.connection)

  // whenever app start , get tokenListSettings from localStorage
  useAsyncEffect(async () => {
    const userAddedTokens = getLocalItem<SplTokenJsonInfo[]>('USER_ADDED_TOKENS') ?? []
    const tokenListSwitchSettings = getLocalItem<{ [mapName: string]: boolean }>('TOKEN_LIST_SWITCH_SETTINGS') ?? {}

    useToken.setState((s) => ({
      tokenListSettings: {
        ...s.tokenListSettings,
        [SOLANA_TOKEN_LIST_NAME]: {
          ...s.tokenListSettings[SOLANA_TOKEN_LIST_NAME],
          isOn: tokenListSwitchSettings[SOLANA_TOKEN_LIST_NAME] ?? s.tokenListSettings[SOLANA_TOKEN_LIST_NAME].isOn
        },
        [USER_ADDED_TOKEN_LIST_NAME]: {
          ...s.tokenListSettings[USER_ADDED_TOKEN_LIST_NAME],
          mints: new Set(userAddedTokens.map((token) => toPubString(token.mint))),
          isOn:
            tokenListSwitchSettings[USER_ADDED_TOKEN_LIST_NAME] ?? s.tokenListSettings[USER_ADDED_TOKEN_LIST_NAME].isOn
        }
      }
    }))

    if (connection) {
      const decimalsedUserAddedTokensInLocalStorage = shakeUndifindedItem(
        await getTokenFromLocalStorage(userAddedTokens)
      )
      useToken.setState((s) => {
        const added = {
          ...s.userAddedTokens,
          ...listToMap(decimalsedUserAddedTokensInLocalStorage, (i) => toPubString(i.mint))
        }
        return {
          userAddedTokens: added
        }
      })
    }
  }, [connection, refreshTokenListCount])

  const tokenListSettings = useToken((s) => s.tokenListSettings)

  useEffect(() => {
    setLocalItem(
      'TOKEN_LIST_SWITCH_SETTINGS',
      objectMap(tokenListSettings, (i) => i.isOn)
    )
  }, [tokenListSettings])
}
