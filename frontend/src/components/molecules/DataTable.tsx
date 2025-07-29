import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationNav } from './Pagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[] | null;
  pageCount?: number;
  currentPage?: number;
  pageSize?: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearchText: (searchText: string) => void;
  searchText: string | null;
  searchPlaceholderText?: string;
}

export function DataTable<TData, TValue>({
  data,
  columns,
  pageCount,
  currentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
  setSearchText,
  searchText,
  searchPlaceholderText,
}: DataTableProps<TData, TValue>) {
  const currentPageHandler = React.useCallback(
    (page: number) => {
      console.log('[DataTableForServerSideFiltering]: currentPageHandler');
      setCurrentPage(page);
    },
    [setCurrentPage],
  );

  console.log('[DataTableForServerSideFiltering]:');

  const memoizedData = React.useMemo(() => data || [], [data]);
  const memoizedColumns = React.useMemo(() => columns, [columns]);
  const paginationState = React.useMemo(
    () => ({
      pageIndex: currentPage ?? 0,
      pageSize: pageSize ?? 10,
    }),
    [currentPage, pageSize],
  );

  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    pageCount: pageCount ?? 0,
    manualPagination: true,
    state: {
      pagination: paginationState,
    },
  });

  React.useEffect(() => {
    console.log('DataTableForServerSideFiltering mounted');
    return () => {
      console.log('DataTableForServerSideFiltering unmounted');
    };
  }, []);

  return (
    <div className="w-full ">
      <div className="flex items-center py-4">
        <Input
          placeholder={searchPlaceholderText || 'Search...'}
          value={searchText ?? ''}
          onChange={(event) => setSearchText(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <PaginationNav
          currentPage={currentPage ? currentPage + 1 : 1}
          pages={pageCount ?? 1}
          handlePage={currentPageHandler}
        />
      </div>
    </div>
  );
}
