import { IAuthUser } from '@/types/IAuthUser';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface SSEvent {
  context: object;
  timestamp: string;
}

interface EventQueue {
  eventType: string;
  events: SSEvent[];
  dequeuedEvent?: SSEvent;
}

interface SSEState {
  eventQueues: EventQueue[];
  error: string | null;
  connected: boolean;
  loading: boolean;
}

const initialState: SSEState = {
  eventQueues: [],
  error: null,
  connected: false,
  loading: true,
};

export const sseConnection = createAsyncThunk(
  'sse/connectionEstablished',
  async (_, { rejectWithValue, getState, dispatch }) => {
    return new Promise<{ status: string }>((resolve) => {
      const authUser = (getState() as any).auth as IAuthUser;
      if (!authUser?.token) {
        return rejectWithValue({ status: 'user not logged in' });
      }

      axios
        .get(`${import.meta.env.VITE_API_URL}/sse/register`, {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${authUser?.token}`,
          },
        })
        .then((response) => {
          if (response.status === 200) {
            console.log('SSE connection response:', response);
          } else {
            rejectWithValue({ status: 'error' });
          }
        })
        .catch((error) => {
          rejectWithValue({ status: 'error' });
        });
    });
  },
);

export const sseSlice = createSlice({
  name: 'sse',
  initialState,
  reducers: {
    registerQueue: (state, action: PayloadAction<string>) => {
      const eventType = action.payload;
      const existingQueue = state.eventQueues.find(
        (queue) => queue.eventType === eventType,
      );
      if (existingQueue) {
        console.warn(`Event queue for ${eventType} already exists.`);
      } else {
        state.eventQueues.push({ eventType, events: [] });
        console.log(`Registered new event queue : ${eventType}`);
      }
    },
    unregisterQueue: (state, action: PayloadAction<string>) => {
      const eventType = action.payload;
      const existingQueue = state.eventQueues.find(
        (queue) => queue.eventType === eventType,
      );
      if (existingQueue) {
        state.eventQueues = state.eventQueues.filter(
          (queue) => queue.eventType !== eventType,
        );
        console.log(`Unregistered event queue : ${eventType}`);
      } else {
        console.warn(`No event queue found for ${eventType} to unregister.`);
      }
    },
    enqueueEvent: (
      state,
      action: PayloadAction<{ eventType: string; event: SSEvent }>,
    ) => {
      const { eventType, event } = action.payload;
      const queue = state.eventQueues.find(
        (queue) => queue.eventType === eventType,
      );
      if (queue) {
        queue.events.push(event);
        console.log(`Enqueued event to ${eventType} queue:`, event);
      } else {
        console.warn(`No event queue found for ${eventType} to enqueue event.`);
      }
    },
    dequeueEvent: (
      state,
      action: PayloadAction<{ eventType: string; event?: SSEvent }>,
    ) => {
      const { eventType } = action.payload;
      const queue = state.eventQueues.find((q) => q.eventType === eventType);
      if (queue && queue.events.length > 0) {
        queue.dequeuedEvent = queue.events.shift();
        console.log(
          `Dequeued event from ${eventType} queue.`,
          queue.dequeuedEvent,
        );
      } else {
        console.warn(`No event to dequeue from ${eventType} queue.`);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sseConnection.fulfilled, (state) => {
      state.connected = true;
      console.log('SSE connection established.');
    });
  },
});

export const { registerQueue, unregisterQueue, enqueueEvent, dequeueEvent } =
  sseSlice.actions;
export default sseSlice.reducer;
