import { ColumnDef, Table } from '@tanstack/react-table';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { DataTable } from '@/components/molecules/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@radix-ui/react-checkbox';
import { AxiosInstance } from 'axios';
import AxiosReqest from '@/services/axiosInspector';
import { Skeleton } from '../ui/skeleton';
import { assets } from '@/config/assets';
import RoleFilterDropdown from '../molecules/RoleFilterDropdown';
import { IUser } from '@/types/IUser';
import { useToast } from '@/hooks/use-toast';

import AdminActionsDropDown from '../molecules/AdminActionsDropDown';

interface IProfilePhoto {
  category: string;
  id: string;
  fileName: string;
  fileType: string;
  isPublic: boolean;
}
export interface ITableUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture: IProfilePhoto;
}

export default function UserDataTable() {
  const axiosInstance: AxiosInstance = AxiosReqest().axiosInstance;
  const [users, setUsers] = useState<ITableUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<null | string>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<string[]>(['role']);
  const [filterValue, setFilterValue] = useState<string[][]>([
    ['BIDDER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  ]);
  const [filterByQuery, setFilterByQuery] = useState<string | null>('role');
  const [filterValueQuery, setFilterValueQuery] = useState<string | null>(
    '(BIDDER,SELLER,ADMIN)',
  );
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [search, setSearch] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isInSearchDelay, setIsInSearchDelay] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    if (!isInSearchDelay) {
      axiosInstance
        .get('/user/getUsers', {
          params: {
            sortBy: sortBy,
            filterBy: encodeURIComponent(JSON.stringify(filterBy)),
            filterValue: encodeURIComponent(JSON.stringify(filterValue)),
            order: order,
            limit: limit,
            offset: offset,
            search: search,
          },
        })
        .then((usersData) => {
          const data: Array<ITableUser> = usersData.data.content.map(
            (user: any, index: number): ITableUser => {
              return {
                id: index,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.userRole?.userRole,
                profilePicture: user.profilePicture,
              };
            },
          );
          setUsers(data);
          setCurrentPage(usersData?.data?.page.number);
          setPageCount(usersData?.data?.page.totalPages);
          setPageSize(usersData?.data?.page.size);
          console.log('Users Data:', usersData);
        })
        .catch((error) => {
          console.error('Error fetching users:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [sortBy, order, limit, offset, filterBy, filterValue, isInSearchDelay]);

  // remove later
  useEffect(() => {
    console.log('userDataTable mounted');

    return () => {
      console.log('userDataTable unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('userDataTable updated');
  }, [users, sortBy, order, limit, offset]);

  let delay = null;
  useEffect(() => {
    if (!isInSearchDelay) {
      setIsInSearchDelay(true);
      delay = setTimeout(() => {
        setOffset(0);
        setCurrentPage(0);
        setIsInSearchDelay(false);
      }, 800);
    }
  }, [search]);

  useEffect(() => {
    console.log('Users:', users);
  }, [users]);

  const filterByHandler = useCallback(
    (filterByCol: string, filterVal: string, isAdded: boolean) => {
      console.log('[filterByHandler]', { filterByCol, filterVal, isAdded });

      if (filterByCol === 'NONE' || filterVal === 'NONE') {
        console.log('[filterByHandler] clearing filters');
        setFilterBy([]);
        setFilterValue([]);
        setFilterByQuery(null);
        setFilterValueQuery(null);
        return;
      }

      const indexFilterBy = filterBy.indexOf(filterByCol);
      console.log('[filterByHandler] current filterBy:', filterBy);
      console.log('[filterByHandler] current filterValue:', filterValue);

      if (indexFilterBy === -1 && isAdded) {
        console.log('[filterByHandler] adding new filter group');
        setFilterBy((prev) => [...prev, filterByCol]);
        setFilterValue((prev) => [...prev, [filterVal]]);
      } else if (indexFilterBy !== -1 && isAdded) {
        console.log('[filterByHandler] adding value to existing filter group');
        const newFilterValue = [...filterValue];
        if (!newFilterValue[indexFilterBy].includes(filterVal)) {
          newFilterValue[indexFilterBy].push(filterVal);
          setFilterValue(newFilterValue);
        }
      } else if (indexFilterBy !== -1 && !isAdded) {
        console.log('[filterByHandler] removing value from filter group');
        const newFilterValue = [...filterValue];
        newFilterValue[indexFilterBy] = newFilterValue[indexFilterBy].filter(
          (v) => v !== filterVal,
        );
        if (newFilterValue[indexFilterBy].length === 0) {
          const newFilterBy = [...filterBy];
          newFilterBy.splice(indexFilterBy, 1);
          newFilterValue.splice(indexFilterBy, 1);
          setFilterBy(newFilterBy);
          setFilterValue(newFilterValue);
        } else {
          setFilterValue(newFilterValue);
        }
      } else {
        console.error('[filterByHandler] Invalid filter operation');
      }
    },
    [filterBy, filterValue],
  );

  const isFilterApplied = useCallback(
    (filterCol: string, filterVal: string) => {
      const indexFilterBy = filterBy.indexOf(filterCol);
      const isApplied =
        indexFilterBy !== -1 && filterValue[indexFilterBy].includes(filterVal);
      console.log('[isFilterApplied]', { filterCol, filterVal, isApplied });
      return isApplied;
    },
    [filterBy, filterValue],
  );

  const ProfilePhoto = (id: string | null) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (id) {
        setIsLoading(true);
        axiosInstance
          .get(`/user/getUserProfilePhoto?file_uuid=${id}`, {
            responseType: 'blob',
          })
          .then((response) => {
            const url = URL.createObjectURL(response.data);
            setImageUrl(url);
          })
          .catch((error) => {
            console.error('Error fetching profile image:', error);
            setImageUrl(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }

      return () => {
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    }, [id, axiosInstance]);

    return (
      <div className="flex items-center justify-center">
        {!isLoading ? (
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200">
            <img
              src={imageUrl || assets.default_profile_image}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <Skeleton className="h-10 w-10 rounded-full" />
        )}
      </div>
    );
  };

  const userColumns: ColumnDef<ITableUser>[] = [
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
      accessorKey: 'profilePicture',
      header: '',
      enableSorting: false,
      enableHiding: true,
      cell: ({ row }) =>
        ProfilePhoto((row.getValue('profilePicture') as IProfilePhoto)?.id),
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
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('username')}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              setSortBy(column.id);
              setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
            }}
          >
            First Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('firstName')}</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'lastName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              setSortBy(column.id);
              setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
            }}
          >
            Last Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('lastName')}</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              setSortBy(column.id);
              setOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
            }}
          >
            Email
            <ArrowUpDown />
          </Button>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => {
        console.log('[userDataTable] role header rendered');
        return (
          <RoleFilterDropdown
            isFilterApplied={isFilterApplied}
            filterByHandler={filterByHandler}
          />
        );
      },
      cell: ({ row }) => <div>{row.getValue('role')}</div>,
      enableHiding: true,
      enableSorting: true,
      enableGrouping: true,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return <AdminActionsDropDown row={row} />;
      },
    },
  ];

  const offsetHandler = useCallback(
    (offset: number) => {
      setOffset(offset);
      console.log('[userDataTable] offsetHandler');
    },
    [setOffset],
  );

  const pageSizeHandler = useCallback(
    (pageSize: number) => {
      setPageSize(pageSize);
      console.log('[userDataTable] pageSizeHandler');
    },
    [pageSize],
  );

  const searchHandler = useCallback(
    (search: string) => {
      setSearch(search);
      console.log('[userDataTable] searchHandler');
    },
    [setSearch],
  );

  return (
    <>
      <DataTable
        columns={userColumns}
        data={users}
        pageCount={pageCount}
        pageSize={pageSize}
        currentPage={currentPage}
        setCurrentPage={offsetHandler}
        setPageSize={pageSizeHandler}
        setSearchText={searchHandler}
        searchText={search}
      />
    </>
  );
}
