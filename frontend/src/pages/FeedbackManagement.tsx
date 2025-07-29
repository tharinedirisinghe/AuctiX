import React, { useCallback, useMemo } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import useAxiosRequest from '@/services/axiosInspector';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface Feedback {
  id: string;
  comment: string;
  rating: number;
  userId: string | null;
  username?: string | null;
  submittedAt: string;
}

const getRatingStars = (rating: number) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`text-sm ${
          star <= rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ))}
    <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
  </div>
);

const FeedbackDetailsModal: React.FC<{
  open: boolean;
  feedback: Feedback | null;
  onClose: () => void;
}> = ({ open, feedback, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Feedback Details</DialogTitle>
      </DialogHeader>
      {feedback && (
        <div className="space-y-2">
          <div>
            <span className="font-semibold">User: </span>
            {feedback.username || feedback.userId || 'Guest'}
          </div>
          <div>
            <span className="font-semibold">Rating: </span>
            {getRatingStars(feedback.rating)}
          </div>
          <div>
            <span className="font-semibold">Message: </span>
            <span>{feedback.comment}</span>
          </div>
          <div>
            <span className="font-semibold">Submitted At: </span>
            {new Date(feedback.submittedAt).toLocaleString()}
          </div>
        </div>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const FeedbackManagement: React.FC = () => {
  const [data, setData] = React.useState<Feedback[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const { axiosInstance } = useAxiosRequest();
  const [searchValue, setSearchValue] = React.useState('');
  const [searchTrigger, setSearchTrigger] = React.useState(0);
  const [selectedRating, setSelectedRating] = React.useState('all');
  const [ratingTrigger, setRatingTrigger] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    React.useState<Feedback | null>(null);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'submittedAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Fetch feedbacks for current page from backend
  React.useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          page: pageIndex,
          size: pageSize,
        };
        if (searchValue) params.query = searchValue;
        if (selectedRating !== 'all' && selectedRating !== '') {
          params.rating = selectedRating;
        }
        // Use sortBy and sortDir for backend sorting
        if (sorting.length > 0) {
          params.sortBy = sorting[0].id;
          params.sortDir = sorting[0].desc ? 'desc' : 'asc';
        }

        const response = await axiosInstance.get('/feedback', { params });
        const apiFeedbacks = Array.isArray(response.data?.content)
          ? response.data.content
          : [];
        setData(
          apiFeedbacks.map((fb: any) => ({
            id: fb.id,
            comment: fb.comment,
            rating: fb.rating,
            userId: fb.userId,
            username: fb.username,
            submittedAt: fb.submittedAt,
          })),
        );
        setTotalPages(response.data.page?.totalPages || 1);
      } catch (err) {
        setError('Failed to fetch feedbacks.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [
    pageIndex,
    pageSize,
    searchTrigger,
    selectedRating,
    ratingTrigger,
    sorting,
  ]);

  const handleViewDetails = useCallback((feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setModalOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Feedback>[]>(
    () => [
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ row }) =>
          row.original.username || row.original.userId || 'Guest',
        enableSorting: false,
      },
      {
        accessorKey: 'comment',
        header: 'Message',
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate" title={row.original.comment}>
            {row.original.comment}
          </div>
        ),
        enableSorting: false,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'rating',
        header: () => (
          <Button
            variant="ghost"
            onClick={() =>
              setSorting((prev) => {
                const current = prev.find((s) => s.id === 'rating');
                if (!current) return [{ id: 'rating', desc: false }];
                return [{ id: 'rating', desc: !current.desc }];
              })
            }
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => getRatingStars(row.original.rating),
        enableSorting: true,
      },
      {
        accessorKey: 'submittedAt',
        header: () => (
          <Button
            variant="ghost"
            onClick={() =>
              setSorting((prev) => {
                const current = prev.find((s) => s.id === 'submittedAt');
                if (!current) return [{ id: 'submittedAt', desc: false }];
                return [{ id: 'submittedAt', desc: !current.desc }];
              })
            }
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => new Date(row.original.submittedAt).toLocaleString(),
        enableSorting: true,
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const feedback = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(feedback.id)}
                >
                  Copy feedback ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewDetails(feedback)}>
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleViewDetails, setSorting],
  );

  // Helper to get visible columns
  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (col) => columnVisibility[col.id || col.accessorKey] !== false,
      ),
    [columns, columnVisibility],
  );

  // Table mock for rendering
  const table = useMemo(
    () => ({
      getHeaderGroups: () => [
        {
          id: 'main',
          headers: columns.map((col) => ({
            id: col.id || col.accessorKey,
            column: { columnDef: col },
            isPlaceholder: false,
            getContext: () => ({ column: { columnDef: col } }),
          })),
        },
      ],
      getRowModel: () => ({
        rows: data.map((row) => ({
          id: row.id,
          original: row,
          getVisibleCells: () =>
            columns.map((col) => ({
              id: col.id || col.accessorKey,
              column: { columnDef: col },
              getContext: () => ({
                row: { original: row },
                column: { columnDef: col },
              }),
            })),
          getIsSelected: () => false,
        })),
      }),
      getAllColumns: () =>
        columns.map((col) => ({
          id: col.id || col.accessorKey,
          getCanHide: () => col.enableHiding !== false,
          getIsVisible: () =>
            columnVisibility[col.id || col.accessorKey] !== false,
          toggleVisibility: (visible: boolean) => {
            setColumnVisibility((v) => ({
              ...v,
              [col.id || col.accessorKey]: visible,
            }));
          },
        })),
      getColumn: (id: string) => ({
        getFilterValue: () =>
          columnFilters.find((f) => f.id === id)?.value ?? '',
        setFilterValue: (value: string) => {
          setColumnFilters((f) =>
            f.some((fl) => fl.id === id)
              ? f.map((fl) => (fl.id === id ? { ...fl, value } : fl))
              : [...f, { id, value }],
          );
        },
      }),
      getState: () => ({
        pagination: { pageIndex, pageSize },
      }),
      getPageCount: () => totalPages,
    }),
    [
      columns,
      data,
      columnVisibility,
      columnFilters,
      pageIndex,
      pageSize,
      totalPages,
    ],
  );

  return (
    <div className="bg-white min-h-screen">
      <header className="relative h-28 w-full bg-yellow-400 mb-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <h1 className="text-4xl font-bold text-white absolute bottom-0 left-0 right-0 px-6 md:px-8 mb-4">
          Feedbacks
        </h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex items-center">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search message..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPageIndex(0);
                    setSearchTrigger((st) => st + 1);
                  }
                }}
                className="pl-8 max-w-xs"
              />
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => {
                  setPageIndex(0);
                  setSearchTrigger((st) => st + 1);
                }}
              >
                Search
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-40 flex justify-between">
                  {selectedRating === 'all'
                    ? 'All Ratings'
                    : `${selectedRating} ★`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRating('all');
                    setPageIndex(0);
                    setRatingTrigger((rt) => rt + 1);
                  }}
                  className={selectedRating === 'all' ? 'font-semibold' : ''}
                >
                  All Ratings
                </DropdownMenuItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => {
                      setSelectedRating(String(r));
                      setPageIndex(0);
                      setRatingTrigger((rt) => rt + 1);
                    }}
                    className={
                      selectedRating === String(r) ? 'font-semibold' : ''
                    }
                  >
                    {r} ★
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
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
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {loading ? (
          <div className="text-center py-8 text-lg text-gray-500">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-lg text-red-500">{error}</div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {visibleColumns.map((col) => {
                        const header = {
                          id: col.id || col.accessorKey,
                          column: { columnDef: col },
                          isPlaceholder: false,
                          getContext: () => ({
                            header: {},
                            table: {},
                            column: { columnDef: col },
                          }),
                        };
                        return (
                          <TableHead key={header.id} className=" text-left">
                            {header.isPlaceholder
                              ? null
                              : flexRender(col.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {data.length ? (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.id || col.accessorKey}
                            className="px-2 py-2"
                          >
                            {flexRender(col.cell, {
                              row: { original: row },
                              column: { columnDef: col },
                            })}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination controls */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {data.length} row(s) on this page.
              </div>
              <div className="space-x-2 flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(0)}
                  disabled={pageIndex === 0 || totalPages === 0}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex(pageIndex > 0 ? pageIndex - 1 : 0)
                  }
                  disabled={pageIndex === 0 || totalPages === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {totalPages === 0 ? 0 : pageIndex + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex(
                      pageIndex + 1 < totalPages ? pageIndex + 1 : pageIndex,
                    )
                  }
                  disabled={pageIndex + 1 >= totalPages || totalPages === 0}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex(totalPages > 0 ? totalPages - 1 : 0)
                  }
                  disabled={pageIndex + 1 >= totalPages || totalPages === 0}
                >
                  Last
                </Button>
              </div>
            </div>
            <FeedbackDetailsModal
              open={modalOpen}
              feedback={selectedFeedback}
              onClose={() => setModalOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
