import { IUser } from '@/types/IUser';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { AdminToolsEnum } from '@/components/organisms/AdminTools';

interface AdminToolsState {
  selectedUsername: string | null;
  activeTool: AdminToolsEnum | null;
  ready: boolean;
}

const initialState: AdminToolsState = {
  selectedUsername: null,
  activeTool: null,
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
        user: string | null;
        tool: AdminToolsEnum | null;
      }>,
    ) => {
      state.selectedUsername = action.payload.user;
      state.activeTool = action.payload.tool;
      state.ready = true;
    },
    closeTool: (state) => {
      state.selectedUsername = null;
      state.activeTool = null;
      state.ready = false;
    },
  },
});

export const { openTool, closeTool } = adminToolsReducer.actions;
export default adminToolsReducer.reducer;
