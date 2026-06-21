
import { cn } from '@/lib/utils'

export type TableProps = React.HTMLAttributes<HTMLTableElement>
export default function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 no-scrollbar">
      <table className={cn('w-full border-separate border-spacing-y-3', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>
export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>
export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  hoverable?: boolean
}
export function TableRow({ className, hoverable, children, ...props }: TableRowProps) {
  return (
    <tr className={cn('bg-card', hoverable && 'hover:bg-accent/20', className)} {...props}>
      {children}
    </tr>
  )
}

export type TableCellProps = React.THTMLAttributes<HTMLTableCellElement>
export function TableHeadCell({ className, children, ...props }: TableCellProps) {
  return (
    <th className={cn('py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-widest', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td className={cn('py-4 border-y border-border/20', className)} {...props}>
      {children}
    </td>
  )
}
