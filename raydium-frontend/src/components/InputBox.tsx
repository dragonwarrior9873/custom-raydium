import { ReactNode, RefObject, useRef } from 'react'

import { twMerge } from 'tailwind-merge'

import { shrinkToValue } from '@/functions/shrinkToValue'

import mergeRef from '@/functions/react/mergeRef'
import Col from './Col'
import DecimalInput, { DecimalInputProps } from './DecimalInput'
import Input, { InputProps } from './Input'

export type InputBoxProps = {
  className?: string

  // validator
  disabled?: boolean
  noDisableStyle?: boolean

  label?: ReactNode
  labelClassName?: string

  onEnter?: InputProps['onEnter']
  /** should  attach domref want focus input by click */
  renderInput?: ((inputRef: RefObject<any>) => ReactNode) | ReactNode
} & (
  | ({ decimalMode: true } & DecimalInputProps & { inputProps?: DecimalInputProps })
  | ({ decimalMode?: false } & InputProps & { inputProps?: InputProps })
)

export default function InputBox({
  decimalMode,
  className,

  disabled,
  noDisableStyle,

  label,
  labelClassName,

  inputProps,
  renderInput,
  ...restProps // input Props
}: InputBoxProps) {
  const inputRef = useRef<HTMLElement>(null)
  function focusInput() {
    inputRef.current?.focus?.()
    inputRef.current?.click?.()
  }
  return (
    <Col
      onClick={focusInput}
      className={twMerge(
        `bg-[#141041] justify-between rounded-xl mobile:rounded-lg py-3 px-6 mobile:py-2 mobile:px-4 cursor-text ${
          disabled && !noDisableStyle ? 'pointer-events-none-entirely cursor-default opacity-50' : ''
        }`,
        className
      )}
    >
      {label && (
        <div className={twMerge(`text-xs mobile:text-2xs text-[#abc4ff80] font-medium `, labelClassName)}>{label}</div>
      )}
      {shrinkToValue(renderInput, [inputRef]) ??
        (decimalMode ? (
          <DecimalInput
            noCSSInputDefaultWidth
            {...(restProps as DecimalInputProps)}
            {...(inputProps as DecimalInputProps)}
            className={twMerge('w-full py-1 mobile:py-1 font-medium', inputProps?.className)}
            componentRef={mergeRef(inputRef, inputProps?.componentRef)}
          />
        ) : (
          <Input
            noCSSInputDefaultWidth
            {...(restProps as InputProps)}
            {...(inputProps as InputProps)}
            className={twMerge('w-full py-1 mobile:py-1 font-medium', inputProps?.className)}
            componentRef={mergeRef(inputRef, inputProps?.componentRef)}
          />
        ))}
    </Col>
  )
}
