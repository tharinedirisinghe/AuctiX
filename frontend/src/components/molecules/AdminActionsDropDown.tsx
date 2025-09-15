import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AdminToolsEnum } from '../organisms/AdminTools';
import { openTool } from '@/store/slices/adminToolsSlice';
import { ITableUser } from '../organisms/UserDataTable';

export default function AdminActionsDropDown({ user }: { user: ITableUser }) {
  const appDispatch = useAppDispatch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() =>
            user?.username && navigator.clipboard.writeText(user.username)
          }
        >
          Copy Username
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            appDispatch(
              openTool({
                user: user,
                tool: AdminToolsEnum.REMOVE_PROFILE_PICTURE,
              }),
            )
          }
        >
          Remove Profile Picture
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            appDispatch(
              openTool({
                user: user,
                tool: AdminToolsEnum.BAN_USER,
              }),
            )
          }
        >
          Ban User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
