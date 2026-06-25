import {
  type ColumnDef,
  type Row
} from "@tanstack/react-table"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { DataTableRowDragHandle } from "./data-table"

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return ""
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

export function getSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export function getDragColumn<TData>(
  isReorderEnabled: boolean | ((row: Row<TData>) => boolean) = true
): ColumnDef<TData> {
  return {
    id: "drag",
    header: () => <div className="w-7" />,
    cell: ({ row }) => {
      const enabled = typeof isReorderEnabled === "function" ? isReorderEnabled(row) : isReorderEnabled
      return enabled ? <DataTableRowDragHandle /> : null
    },
    enableHiding: false,
  }
}

export function getDateColumn<TData>(
  accessorKey: keyof TData | string,
  header: string,
  placeholder = ""
): ColumnDef<TData> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const val = row.getValue(accessorKey as string) as string | null | undefined
      return (
        <div className="tabular-nums">
          {val ? formatDate(val) : placeholder}
        </div>
      )
    },
  }
}
