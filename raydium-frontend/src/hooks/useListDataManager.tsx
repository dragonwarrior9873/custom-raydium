import { useState, useMemo, useEffect } from 'react'

export default function useListDataManager<T>(
  arr: T[],
  /** !if key is same, it will not re-render */
  getItemKey: (item: T, idx: number) => string | number | undefined, // for compare
  options?: {
    searchText?: string // TODO: imply it!!!
    onListChange?: (newlist: T[]) => void
  }
): { wrapped: { data: T; destorySelf(): void; changeSelf(newItem: T): void }[]; controls: { clear(): void } } {
  const wholeArrSignature = arr.map((i, idx) => getItemKey(i, idx) ?? idx).join('-')
  const [dataList, setDataList] = useState(arr)
  const [searchText, setSearchText] = useState(options?.searchText) // TODO: imply it!!!

  useEffect(() => {
    if (dataList === arr) return
    setDataList?.(arr)
  }, [wholeArrSignature])

  useEffect(() => {
    if (dataList === arr) return
    options?.onListChange?.(dataList)
  }, [dataList])

  const wrapped = useMemo(
    () =>
      dataList.map((item, idx) => ({
        data: item,
        destorySelf: () => {
          setDataList((prev) => prev.filter((dataItem, dataIndex) => dataIndex !== idx))
        },
        changeSelf: (newItem) => {
          setDataList((prev) => prev.map((dataItem, dataIndex) => (dataIndex === idx ? newItem : dataItem)))
        }
      })),
    [dataList]
  )

  const controls = useMemo(
    () => ({
      clear: () => {
        setDataList([])
        setSearchText('')
      }
    }),
    []
  )

  return { wrapped, controls }
}
