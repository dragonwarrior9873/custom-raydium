import { PublicKeyish } from '@/types/constants'
import { create } from 'zustand'
import { UIRewardInfo } from './type'

export type CreateFarmStore = {
  farmId?: string // only in edit mode
  isRoutedByCreateOrEdit?: boolean // check in 2 review page
  poolId?: string
  rewards: UIRewardInfo[]
  cannotAddNewReward?: boolean // only creater can add token info entry
}

const useCreateFarms = create<CreateFarmStore>((set) => ({
  rewards: []
}))

export default useCreateFarms

export function cleanStoreEmptyRewards() {
  useCreateFarms.setState((state) => ({
    rewards: state.rewards.filter((r) => r.amount)
  }))
}
