import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/molecules/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@radix-ui/react-checkbox';
import AxiosReqest from '@/services/axiosInspector';

interface IUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profile_photo: string | null;
  role: string;
}
interface IComplaint {
  id: string;
  reportedUser: IUser;
  reportedBy: IUser;
  reason: string;
  dateReported: string;
  status: string;
}

export default function ComplaintDataTable({
  selectedStatus,
  setSelectedStatus,
}: {
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}) {
  const axiosInstance = AxiosReqest().axiosInstance;
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<null | string>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [searchDebounced, setSearchDebounced] = useState<string>('');
  const [statusTrigger, setStatusTrigger] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    setIsLoading(true);
    axiosInstance
      .get('/complaints', {
        params: {
          sortby: sortBy,
          order: order,
          size: pageSize,
          page: currentPage,
          search: searchDebounced,
          ...(selectedStatus !== 'all' && { status: selectedStatus }),
        },
      })
      .then((complaintsData) => {
        setComplaints(complaintsData?.data?.content || []);
        setPageCount(complaintsData?.data?.totalPages || 1);
        setPageSize(complaintsData?.data?.size || pageSize);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    sortBy,
    order,
    pageSize,
    currentPage,
    searchDebounced,
    selectedStatus,
    statusTrigger,
  ]);

  const complaintsColumns: ColumnDef<IComplaint>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'readableId',
      header: 'Report ID',
      cell: ({ row }) => <div>{row.getValue('readableId')}</div>,
      enableHiding: false,
    },
    {
      accessorKey: 'reportedBy.username',
      header: 'Reported By',
      cell: ({ row }) => <div>{row.original.reportedBy.username}</div>,
      enableHiding: true,
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => <div>{row.getValue('reason')}</div>,
      enableHiding: true,
    },
    {
      accessorKey: 'dateReported',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy(column.id);
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Date Reported
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const dateReported = new Date(row.getValue('dateReported'));
        const formattedDate = dateReported.toLocaleDateString('en-GB');
        const formattedTime = dateReported.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <div>
            <div>
              {formattedDate}{' '}
              <span className="text-gray-500 text-sm">{formattedTime}</span>
            </div>
          </div>
        );
      },
      enableHiding: true,
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof statusStyles;
        const statusStyles = {
          PENDING: 'bg-yellow-100 text-yellow-600',
          UNDER_REVIEW: 'bg-blue-100 text-blue-600',
          RESOLVED: 'bg-green-100 text-green-600',
          REJECTED: 'bg-red-100 text-red-600',
        };
        return (
          <span
            className={`px-2 py-1 rounded-md text-sm font-medium ${
              statusStyles[status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {status}
          </span>
        );
      },
      enableHiding: true,
      enableGrouping: true,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const complaint = row.original;
        const [status, setStatus] = useState(complaint.status);

        const handleStatusChange = (newStatus: string) => {
          setStatus(newStatus);
          axiosInstance
            .put(`/complaints/${complaint.id}/status`, { status: newStatus })
            .then(() => {
              // status updated
            })
            .catch(() => {
              // error updating status
            });
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/complaints/${complaint.id}`)}
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(complaint.id)}
              >
                Copy Complaint ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={complaintsColumns}
        data={complaints}
        pageCount={pageCount}
        pageSize={pageSize}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
        setSearchText={setSearchText}
        searchText={searchText}
      />
    </>
  );
}
