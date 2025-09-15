import { IUser } from '@/types/IUser';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { AdminToolsEnum } from '@/components/organisms/AdminTools';
import { ITableUser } from '@/components/organisms/UserDataTable';

interface AdminToolsState {
  selectedUsername: string | null;
  activeTool: AdminToolsEnum | null;
  selectedUser: ITableUser | null;
  ready: boolean;
}

const initialState: AdminToolsState = {
  selectedUsername: null,
  activeTool: null,
  selectedUser: null,
  ready: false,
};

export const getAvailableAdminTools = (state: RootState) => {
  return state.user.role === 'ADMIN' ? Object.values(AdminToolsEnum) : []; //TODO: Implement controlled access to tools based on their permissions
};

export const adminToolsReducer = createSlice({
  name: 'adminTools',
  initialState,
  reducers: {
    openTool: (
      state,
      action: PayloadAction<{
        user: ITableUser | null;
        tool: AdminToolsEnum | null;
      }>,
    ) => {
      if (action.payload.user?.username === undefined) return;
      state.selectedUsername = action.payload.user?.username;
      state.activeTool = action.payload.tool;
      state.selectedUser = action.payload.user;
      state.ready = true;
    },
    closeTool: (state) => {
      state.selectedUsername = null;
      state.activeTool = null;
      state.selectedUser = null;
      state.ready = false;
    },
  },
});

export const { openTool, closeTool } = adminToolsReducer.actions;
export default adminToolsReducer.reducer;
