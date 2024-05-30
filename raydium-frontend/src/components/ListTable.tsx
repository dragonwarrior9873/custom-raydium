/**
 * depends on <List>
 */
import { isNumber, isObject } from '@/functions/judgers/dateType'
import { shrinkToValue } from '@/functions/shrinkToValue'
import { AnyObj, MayArray, MayFunction } from '@/types/constants'
import { SKeyof } from '@/types/generics'
import { CSSProperties, Fragment, ReactNode, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import useListDataManager from '../hooks/useListDataManager'
import Card from './Card'
import Col from './Col'
import Grid from './Grid'
import Row from './Row'

interface ListTableHeader<D> {
  label: string
  renderLabel?: (list: D[]) => ReactNode
  el: HTMLElement | null
}

type ListTableMap<T> = {
  key?: MayArray<SKeyof<T>>
  label: string
  renderLabel?: (list: T[]) => ReactNode
  /** only affact in list-table(PC) */
  cssGridItemWidth?: string // default '1fr'
}

type ListTableProps<T> = {
  // --------- style ---------
  type?: 'list-table' /* default type (common in PC) */ | 'item-card' /* (common in mobile) */

  // --------- core ---------
  list: T[]
  activeItem?: T // active item may have some special style
  getItemKey: (item: T, idx: number) => string | number | undefined
  labelMapper?: MayFunction<ListTableMap<T>[], [properties?: SKeyof<T>[], items?: T]>

  // --------- classNames ---------
  className?: string
  // lable - value
  itemClassName?: string
  rowClassName?: MayFunction<string, [payload: { index: number; item: T }]>
  rowsWrapperClassName?: string
  headersWrapperClassName?: string

  // --------- callback props ---------
  onClickRow?: (payload: { index: number; item: T }) => void
  onListChange?: (newlist: T[]) => void

  // --------- render props ---------
  renderRowItem?: (payload: {
    item: T
    index: number
    key?: MayArray<SKeyof<T>>
    label: string
    wholeDataList: T[]
    header?: ListTableHeader<T>['el']
    allHeaders: ListTableHeader<T>[]
  }) => ReactNode

  /**@deprecated just uses props:`renderControlButtons` and props:`renderItemActionButtons`  */
  renderRowEntry?: (payload: {
    contentNode: ReactNode
    destorySelf(): void
    changeSelf(newItem: T): void
    itemData: T
    index: number
  }) => ReactNode

  // place is predefined
  renderControlButtons?: (payload: {
    destorySelf(): void
    changeSelf(newItem: T): void
    itemData: T
    index: number
  }) => ReactNode

  // place is predefined
  renderItemActionButtons?: (payload: {
    destorySelf(): void
    changeSelf(newItem: T): void
    itemData: T
    index: number
  }) => ReactNode

  renderPropertyLabel?: (property: { key?: MayArray<SKeyof<T>>; label: string; wholeList: T[] }) => ReactNode
}

// NOTE: have base style of bonsai
export default function ListTable<T extends AnyObj>({
  type = 'list-table',
  className,

  itemClassName,
  rowClassName,
  rowsWrapperClassName,
  headersWrapperClassName,

  list,
  labelMapper = (Object.keys(list[0]) as SKeyof<T>[]).map((key) => ({ key, label: key })),

  onClickRow,

  /** !if key is same, it will not re-render */
  getItemKey,
  renderRowItem,
  renderRowEntry,
  renderControlButtons,
  renderItemActionButtons,

  renderPropertyLabel,
  onListChange
}: ListTableProps<T>) {
  const { wrapped, controls } = useListDataManager(list, getItemKey, { onListChange })

  const headerRefs = useRef<ListTableHeader<T>[]>([]) // for itemWidth
  const parsedShowedPropertyNames = shrinkToValue(labelMapper, [Object.keys(list[0] ?? {}), list[0]])

  const gridTemplateStyle = {
    gridTemplateColumns: parsedShowedPropertyNames.map((i) => i.cssGridItemWidth ?? '1fr').join(' '),
    gap: 4
  } as CSSProperties

  const renderListTableRowContent = ({ data }: typeof wrapped[number], idx: number) => {
    return type === 'list-table' ? (
      <Grid
        className={twMerge(
          'text-[#abc4ff] text-xs font-medium py-4 px-5 -mx-5 items-center',
          shrinkToValue(rowClassName, [{ index: idx, item: data }])
        )}
        style={gridTemplateStyle}
        onClick={() => {
          onClickRow?.({ index: idx, item: data })
        }}
      >
        {parsedShowedPropertyNames.map(({ key, label }) => {
          const targetDataItemValue =
            key &&
            (Object.entries(data) as [SKeyof<T>, unknown][]).find(([k, v]) =>
              (isNumber(k) ? String(k) : k).includes(k)
            )?.[1]
          const headerElement = headerRefs.current.find(({ label: headerLabel }) => headerLabel === label)?.el
          return (
            <div
              key={label}
              className={itemClassName}
              style={{ width: headerElement?.clientWidth, alignSelf: 'stretch' }}
            >
              {renderRowItem
                ? renderRowItem({
                    item: data,
                    index: idx,
                    key,
                    label,
                    wholeDataList: list,
                    allHeaders: headerRefs.current,
                    header: headerElement
                  })
                : key
                ? String(targetDataItemValue ?? '')
                : ''}
            </div>
          )
        })}
      </Grid>
    ) : (
      <div
        className={twMerge(
          'bg-[#141041] p-3 divide-y divide-[#abc4ff1a]',
          shrinkToValue(rowClassName, [{ index: idx, item: data }])
        )}
        onClick={() => {
          onClickRow?.({ index: idx, item: data })
        }}
      >
        {parsedShowedPropertyNames.map(({ key, label }) => {
          const targetDataItemValue =
            key &&
            (Object.entries(data) as [SKeyof<T>, unknown][]).find(([k, v]) =>
              (isNumber(k) ? String(k) : k).includes(k)
            )?.[1]
          const headerElement = headerRefs.current.find(({ label: headerLabel }) => headerLabel === label)?.el
          const itemNode = renderRowItem
            ? renderRowItem({
                item: data,
                index: idx,
                key,
                label,
                wholeDataList: list,
                allHeaders: headerRefs.current,
                header: headerElement
              })
            : key
            ? String(targetDataItemValue ?? '')
            : ''
          return (
            <Grid key={label} className={twMerge('grid-cols-2 py-3', itemClassName)}>
              {/* label */}
              <div className="grow text-xs font-semibold text-[#abc4ff80]">{label}</div>

              {/* item */}
              <div key={label} className="text-[#abc4ff] text-xs font-medium">
                {itemNode}
              </div>
            </Grid>
          )
        })}
      </div>
    )
  }

  return type === 'list-table' ? (
    <Card
      className={twMerge(
        'grid bg-cyberpunk-card-bg border-1.5 border-[rgba(171,196,255,0.2)]',
        list?.length > 0 ? '' : 'rounded-bl-none rounded-br-none',
        className
      )}
      size="lg"
    >
      {/* Header */}
      <Grid
        className={twMerge(
          'bg-[#141041] px-5 rounded-tr-inherit rounded-tl-inherit items-center',
          headersWrapperClassName
        )}
        style={gridTemplateStyle}
      >
        {parsedShowedPropertyNames.map(({ key, label, renderLabel }, idx) => (
          <Fragment key={idx}>
            {renderPropertyLabel?.({ key, label, wholeList: list }) ?? (
              <div
                ref={(el) => (headerRefs.current[idx] = { label, el })}
                className="grow text-xs font-semibold text-[#abc4ff80] py-3"
              >
                {renderLabel ? renderLabel(list) : label}
              </div>
            )}
          </Fragment>
        ))}
      </Grid>

      {/* Body */}
      <Col className={twMerge('px-5 divide-y divide-[#abc4ff1a]', rowsWrapperClassName)}>
        {wrapped.map(({ data, destorySelf, changeSelf }, idx) => {
          const contentNode = renderListTableRowContent({ data, destorySelf, changeSelf }, idx)
          const userSettedWholeEntry = renderRowEntry?.({
            contentNode: contentNode,
            destorySelf,
            changeSelf,
            itemData: data,
            index: idx
          })
          const controlsNode = renderControlButtons?.({
            destorySelf,
            changeSelf,
            itemData: data,
            index: idx
          })
          const itemActionNode = renderItemActionButtons?.({
            destorySelf,
            changeSelf,
            itemData: data,
            index: idx
          })
          return (
            <div key={isObject(data) ? (data as any)?.id ?? idx : idx} className="relative">
              {userSettedWholeEntry ?? (
                <>
                  {contentNode}
                  {itemActionNode}
                  {controlsNode && (
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 translate-x-full">{controlsNode}</div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </Col>
    </Card>
  ) : (
    <Grid className={twMerge(className, rowsWrapperClassName)}>
      {wrapped.map(({ data, destorySelf, changeSelf }, idx) => {
        const contentNode = renderListTableRowContent({ data, destorySelf, changeSelf }, idx)
        const userSettedWholeEntry = renderRowEntry?.({
          contentNode: contentNode,
          destorySelf,
          changeSelf,
          itemData: data,
          index: idx
        })
        const controlsNode = renderControlButtons?.({
          destorySelf,
          changeSelf,
          itemData: data,
          index: idx
        })
        const itemActionNode = renderItemActionButtons?.({
          destorySelf,
          changeSelf,
          itemData: data,
          index: idx
        })
        return (
          <Card
            key={isObject(data) ? (data as any)?.id ?? idx : idx}
            className={twMerge(
              'grid bg-cyberpunk-card-bg border-1.5 border-[rgba(171,196,255,0.2)] overflow-hidden',
              shrinkToValue(rowClassName, [{ item: data, index: idx }])
            )}
            size="lg"
          >
            {/* Body */}
            {userSettedWholeEntry ? (
              <div className="relative">{userSettedWholeEntry}</div>
            ) : (
              <>
                <div className="relative">
                  {contentNode}
                  {itemActionNode}
                </div>
                <Row>
                  {/* another btns */}
                  {controlsNode && <Row className="grow justify-end py-3 px-5">{controlsNode}</Row>}
                </Row>
              </>
            )}
          </Card>
        )
      })}
    </Grid>
  )
}
