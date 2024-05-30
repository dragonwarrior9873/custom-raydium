import { create } from 'zustand'

import { BackendApiIdoListItem, BackendApiIdoProjectDetails, HydratedIdoInfo } from './type'
import { MayArray, Numberish } from '@/types/constants'
import { IdoInfo as SDKIdoInfo } from './sdk'
import { inServer } from '@/functions/judgers/isSSR'

type IdoStoreState = {
  hasDeposited?: boolean // secondary flag, primary use backend data
  hasClaimedBase?: boolean // secondary flag, primary use backend data
  hasClaimedQuote?: boolean // secondary flag, primary use backend data
  ticketAmount?: Numberish
}

export type IdoStore = {
  idoHydratedInfos: { [idoid: string]: HydratedIdoInfo }
  shadowIdoHydratedInfos?: { [walletOwner: string]: { [idoid: string]: HydratedIdoInfo } } // for shadowOwners

  idoRawInfos: {
    [idoid: string]: BackendApiIdoListItem
  }
  idoProjectInfos: {
    [idoid: string]: BackendApiIdoProjectDetails
  }
  idoSDKInfos: {
    [idoid: string]: SDKIdoInfo
  }

  /** only use it in acceleraytor/lottery page */
  currentIdoId?: string
  // detail page
  tempJoined: boolean

  currentTab: 'Upcoming Pools' | 'Closed Pools'
  searchText?: string
  idoState: Record<string, IdoStoreState> // for fast refresh without backend

  // do not care it's value, just trigger React refresh
  idoRefreshFactor?: { count: number; refreshIdoId: MayArray<string> }
  refreshIdo: (idoId?: string) => void
}

const useIdo = create<IdoStore>((set, get) => ({
  idoHydratedInfos: {}, // auto parse info in {@link useLiquidityAuto}

  idoRawInfos: {},
  idoProjectInfos: {},
  idoSDKInfos: {},

  // list
  currentTab: 'Closed Pools',
  // detail
  tempJoined: false,

  refreshIdo: (idoId?: string) => {
    if (inServer) return
    setTimeout(() => {
      set((s) => ({
        idoRefreshFactor: {
          count: (get().idoRefreshFactor?.count ?? 0) + 1,
          refreshIdoId: idoId ?? Object.keys(get().idoRawInfos)
        }
      }))
    }, 800) // fot ido info it's immediately change
  },
  idoState: {}
}))

export default useIdo
