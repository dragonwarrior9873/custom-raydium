import useAppSettings from '@/application/common/useAppSettings'
import { isString } from '@/functions/judgers/dateType'
import { shrinkToValue } from '@/functions/shrinkToValue'
import useLocalStorageItem from '@/hooks/useLocalStorage'
import { MayFunction } from '@/types/constants'
import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import Col from './Col'
import Collapse from './Collapse'
import Icon from './Icon'
import Row from './Row'

export type SelectProps<T extends string> = {
  disabled?: boolean
  className?: MayFunction<string, [{ open?: boolean }]>
  faceClassName?: MayFunction<string, [{ open?: boolean }]>
  dropDownOpenedClassName?: MayFunction<string, [{ open?: boolean }]>
  candidateValues: (T | { label: string; value: T })[]
  value?: T
  defaultValue?: T
  prefix?: ReactNode
  /** stable props */
  localStorageKey?: string
  onChange?: (value: T | undefined /* emptify */) => void
}

/**
 * styled component
 */
export default function Select<T extends string>({
  disabled,
  className,
  faceClassName,
  dropDownOpenedClassName,
  candidateValues,
  value,
  defaultValue,
  prefix,
  localStorageKey,
  onChange
}: SelectProps<T>) {
  const parsedCandidates = useMemo(
    () => candidateValues.map((i) => (isString(i) ? { label: i, value: i } : i)),
    [candidateValues]
  )

  const parsedCandidateValues = parsedCandidates.map(({ value }) => value)

  const [currentValue, setCurrentValue] = localStorageKey
    ? useLocalStorageItem(localStorageKey, {
        defaultValue: value ?? defaultValue,
        validateFn: (v) => Boolean(v) && parsedCandidateValues.includes(v!)
      })
    : useState(value ?? defaultValue)

  const isMobile = useAppSettings((s) => s.isMobile)

  useEffect(() => {
    if (value) setCurrentValue(value)
  }, [value])

  useEffect(() => {
    onChange?.(currentValue)
  }, [currentValue])

  const currentLable = useMemo(
    () => parsedCandidates.find(({ value }) => value === currentValue)?.label,
    [currentValue, parsedCandidates]
  )

  const [isOpen, setIsOpen] = React.useState(false)

  const FaceContent = ({ open = false }) => (
    <Row className="items-center w-full">
      {prefix && (
        <div className="mobile:text-xs text-sm font-medium text-[rgba(196,214,255,.5)] mr-1 whitespace-nowrap">
          {prefix}
        </div>
      )}
      <div className="grow mobile:text-xs text-sm font-medium text-[rgba(196,214,255)] whitespace-nowrap">
        {currentLable}
      </div>
      <Icon
        size={isMobile ? 'xs' : 'sm'}
        className="justify-self-end mr-1.5 text-[rgba(196,214,255,.5)] ml-2"
        heroIconName={`${open ? 'chevron-up' : 'chevron-down'}`}
      />
    </Row>
  )

  return (
    <div className={twMerge('relative', shrinkToValue(className, [{ open: isOpen }]))}>
      <div
        className={twMerge(
          `py-2 px-4 mobile:px-3 ring-inset ring-1 ring-[rgba(196,214,255,0.5)] h-full rounded-xl mobile:rounded-lg invisible ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`,
          shrinkToValue(faceClassName, [{ open: isOpen }])
        )}
      >
        <FaceContent />
      </div>
      <Collapse
        className={twMerge(
          `absolute z-10 top-0 left-0 ring-inset ring-1 ring-[rgba(196,214,255,0.5)] rounded-xl mobile:rounded-lg w-full transition ${
            isOpen ? 'bg-cyberpunk-card-bg' : ''
          }`,
          shrinkToValue(dropDownOpenedClassName, [{ open: isOpen }])
        )}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        closeByOutsideClick
      >
        <Collapse.Face>
          {({ isOpen }) => (
            <div className={twMerge('py-2 px-3 mobile:px-2', shrinkToValue(faceClassName, [{ open: isOpen }]))}>
              <FaceContent open={isOpen} />
            </div>
          )}
        </Collapse.Face>
        <Collapse.Body>
          {({ isOpen, close }) => (
            <Col className="border-t-1.5 border-[rgba(171,196,255,.1)] px-3 py-1">
              {candidateValues.map((candidate) => {
                const { label, value } =
                  typeof candidate === 'string' ? { label: candidate, value: candidate } : candidate
                return (
                  <Row
                    key={value}
                    className={`mobile:text-xs text-sm font-medium py-1.5 hover:text-[rgb(196,214,255)] text-[rgba(196,214,255,.5)] cursor-pointer ${
                      value === currentValue ? 'text-[rgba(196,214,255)]' : ''
                    } items-center`}
                    onClick={() => {
                      const parsedValue = value === currentValue ? undefined : value
                      if (parsedValue) {
                        setCurrentValue(parsedValue)
                        close()
                      }
                    }}
                  >
                    {label}
                    {value === currentValue && <Icon size="sm" heroIconName="check" className="ml-2" />}
                  </Row>
                )
              })}
            </Col>
          )}
        </Collapse.Body>
      </Collapse>
    </div>
  )
}
