import { type Table } from "@tanstack/react-table"

export interface ReorderParams<T> {
  activeId: string
  overId: string
  table: Table<T>
  data: T[]
  onReorder: (activeId: string, previousSiblingId: string | null) => void
  setData: (data: T[]) => void
}

export function handleTableReorder<T extends { id: string }>({
                                                               activeId,
                                                               overId,
                                                               table,
                                                               data,
                                                               onReorder,
                                                               setData,
                                                             }: ReorderParams<T>) {
  const filteredRows = table.getRowModel().rows
  const oldIndex = filteredRows.findIndex((row) => row.id === activeId)
  const newIndex = filteredRows.findIndex((row) => row.id === overId)

  if (oldIndex !== -1 && newIndex !== -1) {
    let previousSiblingId: string | null = null
    if (newIndex > 0) {
      if (newIndex > oldIndex) {
        previousSiblingId = overId
      } else {
        previousSiblingId = filteredRows[newIndex - 1].id
      }
    }

    // Optimistic local update
    const oldIdx = data.findIndex((item) => item.id === activeId)
    const newData = [...data]
    const [movedItem] = newData.splice(oldIdx, 1)

    const insertIdx =
      previousSiblingId === null
        ? 0
        : newData.findIndex((item) => item.id === previousSiblingId) + 1

    newData.splice(insertIdx, 0, movedItem)
    setData(newData)

    onReorder(activeId, previousSiblingId)
  }
}


