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
import { useAppDispatch } from '@/store/hooks';
import { AdminToolsEnum } from '../organisms/AdminTools';
import { openTool } from '@/store/slices/adminToolsSlice';

export default function AdminActionsDropDown({ row }: { row: any }) {
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
            navigator.clipboard.writeText(row.getValue('username'))
          }
        >
          Copy Username
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            appDispatch(
              openTool({
                user: row.original.username,
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
                user: row.original.username,
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
