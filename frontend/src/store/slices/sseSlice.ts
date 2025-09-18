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

// Keep a reference to the AbortController for cleanup
let sseControllerRef: AbortController | null = null;

export const sseConnection = createAsyncThunk(
  'sse/connectionEstablished',
  async (_, { rejectWithValue, getState, dispatch }) => {
    const authUser = (getState() as any).auth as IAuthUser;
    if (!authUser?.token) {
      return rejectWithValue({ status: 'user not logged in' });
    }

    // Abort any previous connection
    if (sseControllerRef) {
      sseControllerRef.abort();
    }

    try {
      sseControllerRef = new AbortController();
      const { signal } = sseControllerRef;

      const eventSourceUrl = `${import.meta.env.VITE_API_URL}/sse/register`;
      const response = await fetch(eventSourceUrl, {
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${authUser?.token}`,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      dispatch(setConnectionStatus(true));

      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // Process the stream in a separate async function
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || '';
            for (const message of messages) {
              if (!message.trim()) continue;
              // Parse event and data lines (SSE standard)
              let eventType: string | null = null;
              let eventData: any = null;
              const lines = message.split('\n');
              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventType = line.replace('event:', '').trim();
                } else if (line.startsWith('data:')) {
                  const dataStr = line.replace('data:', '').trim();
                  try {
                    eventData = JSON.parse(dataStr);
                  } catch {
                    eventData = dataStr;
                  }
                }
              }
              if (eventType && eventData !== null) {
                console.log('Received SSE event:', { eventType, eventData });
                dispatch(
                  enqueueEvent({
                    eventType,
                    event: {
                      context: eventData,
                      timestamp: new Date().toISOString(),
                    },
                  }),
                );
              }
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('SSE stream error:', err);
            dispatch(setConnectionStatus(false));
            setTimeout(() => {
              dispatch(sseConnection());
            }, 5000);
          }
        }
      };

      processStream();
      return { status: 'connected' };
    } catch (error) {
      dispatch(setConnectionStatus(false));
      console.error('SSE connection error:', error);
      return rejectWithValue({ status: 'error' });
    }
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
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      state.loading = state.connected ? false : state.loading;
      console.log('SSE connection status updated:', state.connected);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sseConnection.fulfilled, (state) => {
      state.connected = true;
      console.log('SSE connection established.');
    });
    builder.addCase(sseConnection.rejected, (state, action) => {
      state.connected = false;
      console.error('SSE connection failed:', action.payload);
    });
  },
});

export const {
  registerQueue,
  unregisterQueue,
  enqueueEvent,
  dequeueEvent,
  setConnectionStatus,
} = sseSlice.actions;
export default sseSlice.reducer;
