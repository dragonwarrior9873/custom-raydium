import { CSSProperties, Fragment, ReactNode, useState } from 'react'

import { Dialog as _Dialog, Transition } from '@headlessui/react'

import { twMerge } from 'tailwind-merge'

import useAppSettings from '@/application/common/useAppSettings'
import { shrinkToValue } from '@/functions/shrinkToValue'
import useTwoStateSyncer from '@/hooks/use2StateSyncer'
import { MayFunction } from '@/types/generics'
import useGlobInstanceDetector from '@/hooks/useGlobInstanceDetector'

export interface DialogProps {
  /** set this will force only one instance in page */
  pageComponentName?: string
  open: boolean
  /** this is the className of modal card */
  className?: string
  style?: CSSProperties
  children?: MayFunction<ReactNode, [{ close: () => void }]>
  transitionSpeed?: 'fast' | 'normal'
  // if content is scrollable, PLEASE open it!!!, for blur will make scroll super fuzzy
  maskNoBlur?: boolean

  canClosedByMask?: boolean
  /** fired before close transform effect is end */
  onCloseImmediately?(): void
  onClose?(): void
}

export default function Dialog({
  pageComponentName,
  open,
  children,
  className,
  transitionSpeed = 'normal',
  maskNoBlur,
  style,
  canClosedByMask = true,
  onCloseImmediately,
  onClose
}: DialogProps) {
  // for onCloseTransitionEnd
  // during leave transition, open is still true, but innerOpen is false, so transaction will happen without props:open has change (if open is false, React may destory this component immediately)
  const [innerOpen, setInnerOpen] = useState(open)
  const isMobile = useAppSettings((s) => s.isMobile)

  const { isFirstDetectedComponentInThisPage } = useGlobInstanceDetector(pageComponentName)
  const componentCanExist = !pageComponentName || isFirstDetectedComponentInThisPage

  const openDialog = () => setInnerOpen(true)
  const closeDialog = () => setInnerOpen(false)

  useTwoStateSyncer({
    state1: open,
    state2: innerOpen,
    onState1Changed: (open) => {
      open ? openDialog() : closeDialog()
    }
  })

  if (!componentCanExist) return null
  return (
    <Transition as={Fragment} show={innerOpen} beforeLeave={onCloseImmediately} afterLeave={onClose}>
      <_Dialog className="fixed inset-0 z-model overflow-y-auto" onClose={closeDialog}>
        <div className="Dialog w-full h-full fixed" onClick={(ev) => ev.stopPropagation()}>
          <Transition.Child
            as={Fragment}
            enter={`ease-out ${transitionSpeed === 'fast' ? 'duration-150' : 'duration-300'}`}
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave={`ease-in ${transitionSpeed === 'fast' ? 'duration-100' : 'duration-200'}`}
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={`transition fixed inset-0 ${
                maskNoBlur ? '' : 'backdrop-filter backdrop-blur'
              } bg-[rgba(20,16,65,0.4)] ${canClosedByMask ? '' : 'pointer-events-none'}`}
              onClick={closeDialog}
            />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter={`ease-out ${transitionSpeed === 'fast' ? 'duration-150' : 'duration-300'}`}
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave={`ease-in ${transitionSpeed === 'fast' ? 'duration-100' : 'duration-200'}`}
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={twMerge(
                `absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2  transition z-10 self-pointer-events-none`,
                className
              )}
              style={style}
            >
              <div
                style={{
                  /** to comply to the space occupation of side-bar */
                  transform: isMobile ? undefined : 'translateX(calc(var(--side-menu-width) * 1px / 2))'
                }}
              >
                {shrinkToValue(children, [{ close: closeDialog }])}
              </div>
            </div>
          </Transition.Child>
        </div>
      </_Dialog>
    </Transition>
  )
}
