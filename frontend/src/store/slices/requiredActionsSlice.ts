import { IAuthUser } from '@/types/IAuthUser';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { logout } from './authSlice';
import { IPendingAction } from '@/types/IPendingAction';

interface PendingActionState {
  loading: boolean;
  error: string | null;
  lastRedirectAt: number;
  lastRedirectTo: string | null;
  ignoreRedirects: boolean;
  pendingActions: IPendingAction[];
}

const initialState: PendingActionState = {
  loading: true,
  error: null,
  lastRedirectAt: 0,
  lastRedirectTo: null,
  ignoreRedirects: false,
  pendingActions: [],
};

export const fetchPendingRequiredActions = createAsyncThunk(
  'requiredActions/fetchRequiredActions',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const authUser = (getState() as any).auth as IAuthUser;
      const response = await axios.get(
        `${baseURL}/user/getUserRequiredActions`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authUser?.token}`,
          },
        },
      );
      console.log('pending required actions fetched:', response.data);

      if (!response.data) {
        return rejectWithValue('No user data received');
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('Unauthorized! logging out...');
        dispatch(logout());
      }
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to fetch pending required actions',
      );
    }
  },
);

// TODO: Implement the markAsResolved action to handle marking actions as resolved
export interface MarkAsResolvedPayload {
  id?: string;
}

export const markAsResolved = createAsyncThunk(
  'requiredActions/markAsResolved',
  async (
    payload: MarkAsResolvedPayload,
    { rejectWithValue, getState, dispatch },
  ) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const authUser = (getState() as any).auth as IAuthUser;
      const response = await axios
        .post(
          `${baseURL}/user/markActionAsResolved?id=${payload.id}`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authUser?.token}`,
            },
          },
        )
        .then((res) => res.data)
        .catch((err) => {
          console.error('Error marking action as resolved:', err);
          return rejectWithValue('Failed to mark announcement as resolved');
        });
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('Unauthorized! logging out...');
        dispatch(logout());
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark action as resolved',
      );
    }
  },
);

const requiredActionsSlice = createSlice({
  name: 'requiredActions',
  initialState,
  reducers: {
    markLastRedirect: (state, action) => {
      state.lastRedirectAt = Date.now();
      state.lastRedirectTo = action.payload.path || null;
    },
    setIgnoreRedirects: (state, action) => {
      state.ignoreRedirects = action.payload.ignoreRedirects;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingRequiredActions.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Fetching pending actions dispatched...');
      })
      .addCase(fetchPendingRequiredActions.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingActions = action.payload.map((recode: any) => {
          return {
            actionType: recode.actionType || null,
            context:
              typeof recode.context === 'string'
                ? { ...JSON.parse(recode.context), id: recode.id }
                : { ...recode.context, id: recode.id },
            resolvedAt: recode.resolvedAt || null,
            createdAt: recode.createdAt || null,
            resolved: recode.resolved,
          };
        });
        console.log('pending actions updated:', action.payload);
      })
      .addCase(fetchPendingRequiredActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('Error fetching pending actions:', action.payload);
      })
      .addCase(markAsResolved.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Marking action as resolved dispatched...');
      })
      .addCase(markAsResolved.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        console.log('Action marked as resolved:', action.payload);
      })
      .addCase(markAsResolved.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('Error marking action as resolved."):', action.payload);
        state.pendingActions = [];
      });
  },
});

export const { markLastRedirect, setIgnoreRedirects } =
  requiredActionsSlice.actions;
export default requiredActionsSlice.reducer;
