import { ColumnDef } from '@tanstack/react-table';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown, Check, Clock, X, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/molecules/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@radix-ui/react-checkbox';
import { AxiosInstance } from 'axios';
import AxiosRequest from '@/services/axiosInspector';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import AdminActionsDropDown from '../molecules/AdminActionsDropDown';

export enum SellerVerificationStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}

export interface ISellerVerificationRequest {
  id: string;
  sellerFirstName: string;
  sellerLastName: string;
  username: string;
  email: string;
  totalDocumentsSubmitted: number;
  pendingDocumentsCount: number;
  verificationStatus: SellerVerificationStatusEnum;
  submittedAt: string;
}

const StatusBadge = ({ status }: { status: SellerVerificationStatusEnum }) => {
  const statusConfig = {
    [SellerVerificationStatusEnum.PENDING]: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      text: 'Pending',
    },
    [SellerVerificationStatusEnum.APPROVED]: {
      icon: Check,
      color: 'bg-green-100 text-green-800 hover:bg-green-100',
      text: 'Approved',
    },
    [SellerVerificationStatusEnum.REJECTED]: {
      icon: X,
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      text: 'Rejected',
    },
    [SellerVerificationStatusEnum.REQUEST_CHANGES]: {
      icon: AlertCircle,
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      text: 'Changes Requested',
    },
  };

  const config =
    statusConfig[status] || statusConfig[SellerVerificationStatusEnum.PENDING];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};

export default function SellerVerificationRequestsTable() {
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const [requests, setRequests] = useState<ISellerVerificationRequest[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<null | string>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>('');

  const fetchRequests = useCallback(() => {
    setIsLoading(true);
    axiosInstance
      .get('/admin/getSellerVerificationRequests', {
        params: {
          sortBy,
          order,
          limit,
          offset,
          search: searchText || undefined,
        },
      })
      .then((response) => {
        const data: ISellerVerificationRequest[] = response.data.content.map(
          (item: any) => ({
            id: item.id,
            sellerFirstName: item.sellerFirstName,
            sellerLastName: item.sellerLastName,
            username: item.username,
            email: item.email,
            totalDocumentsSubmitted: item.totalDocumentsSubmitted,
            pendingDocumentsCount: item.pendingDocumentsCount,
            verificationStatus: item.verificationStatus,
            submittedAt: item.submittedAt,
          }),
        );
        setRequests(data);
        setCurrentPage(response.data?.page?.number || 0);
        setPageCount(response.data?.page?.totalPages || 0);
        setPageSize(response.data?.page?.size || 10);
      })
      .catch((error) => {
        console.error('Error fetching verification requests:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sortBy, order, limit, offset, searchText]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = (
    id: string,
    status: SellerVerificationStatusEnum,
  ) => {
    setIsLoading(true);
    axiosInstance
      .patch(`/admin/seller-verifications/${id}/status`, { status })
      .then(() => {
        fetchRequests();
      })
      .catch((error) => {
        console.error('Error updating status:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const offsetHandler = useCallback(
    (offset: number) => {
      setOffset(offset);
      console.log('[userDataTable] offsetHandler');
    },
    [setOffset],
  );

  const columns: ColumnDef<ISellerVerificationRequest>[] = [
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
      accessorKey: 'username',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              setSortBy(column.id);
              setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
            }}
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('username')}</div>
      ),
    },
    {
      accessorKey: 'sellerFirstName',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('sellerFirstName');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('sellerFirstName') || '-'}</div>,
    },
    {
      accessorKey: 'sellerLastName',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('sellerLastName');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('sellerLastName') || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('email');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-sm">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'documentsSubmitted',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('documentsSubmitted');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Documents
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.totalDocumentsSubmitted -
            row.original.pendingDocumentsCount}
          /{row.original.totalDocumentsSubmitted}
        </div>
      ),
    },
    {
      accessorKey: 'verificationStatus',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('verificationStatus');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <StatusBadge status={row.getValue('verificationStatus')} />
      ),
      sortingFn: (rowA, rowB) => {
        const statusA = rowA.getValue(
          'verificationStatus',
        ) as SellerVerificationStatusEnum;
        const statusB = rowB.getValue(
          'verificationStatus',
        ) as SellerVerificationStatusEnum;
        return statusA.localeCompare(statusB);
      },
    },
    {
      accessorKey: 'submittedAt',
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            setSortBy('submittedAt');
            setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          }}
        >
          Submitted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('submittedAt')).toLocaleDateString()}
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('submittedAt')).getTime();
        const dateB = new Date(rowB.getValue('submittedAt')).getTime();
        return dateA - dateB;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return <AdminActionsDropDown username={row.getValue('username')} />;
      },
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        columns={columns}
        data={requests}
        pageCount={pageCount}
        currentPage={currentPage}
        pageSize={pageSize}
        setCurrentPage={offsetHandler}
        setPageSize={setPageSize}
        setSearchText={setSearchText}
        searchText={searchText}
        searchPlaceholderText="Search by username or email..."
      />
    </div>
  );
}
