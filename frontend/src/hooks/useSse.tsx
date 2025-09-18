import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from './hooks';
import {
  registerQueue,
  unregisterQueue,
  dequeueEvent,
} from '../store/slices/sseSlice';

/**
 * Custom hook for subscribing to Server-Sent Events
 *
 * @param eventType The type of event to listen for
 * @param callback Function to be called when an event is received
 * @returns Connection status and pending event count
 */
export function useSse<T = any>(
  eventType: string,
  callback: (event: T) => void,
) {
  const dispatch = useAppDispatch();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const isConnected = useAppSelector((state) => state.sse.connected);
  const eventQueue = useAppSelector((state) =>
    state.sse.eventQueues.find((queue) => queue.eventType === eventType),
  );

  useEffect(() => {
    console.log(`Registering SSE listener for event type: ${eventType}`);
    dispatch(registerQueue(eventType));

    return () => {
      console.log(`Unregistering SSE listener for event type: ${eventType}`);
      dispatch(unregisterQueue(eventType));
    };
  }, [dispatch, eventType]);

  useEffect(() => {
    if (!isConnected || !eventQueue || eventQueue.events.length === 0) {
      return;
    }

    // Get the next event to process
    const nextEvent = eventQueue.events[0];
    if (nextEvent) {
      console.log(`Processing SSE event for ${eventType}:`, nextEvent);
      callbackRef.current(nextEvent as T);
      dispatch(dequeueEvent({ eventType }));
    }
  }, [dispatch, eventType, eventQueue, isConnected]);

  return {
    isConnected,
    pendingEvents: eventQueue?.events.length || 0,
  };
}

export default useSse;
