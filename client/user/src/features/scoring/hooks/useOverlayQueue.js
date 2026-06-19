import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Priority Levels:
 * 1: High Priority (Instant Events) - Wickets, Fours, Sixes, Hat-tricks
 * 2: Medium Priority (Contextual) - Milestones, Partnership, Bowler Change
 * 3: Low Priority (Summaries) - End of Over, Innings Break, Match Result
 */

export const useOverlayQueue = () => {
  const [queue, setQueue] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const isPlayingRef = useRef(false);

  // Add event to queue with priority
  const enqueueEvent = useCallback((event) => {
    setQueue((prevQueue) => {
      const newQueue = [
        ...prevQueue,
        { ...event, id: Date.now() + Math.random() },
      ];
      // Sort queue so lower priority number (higher priority) is first
      newQueue.sort((a, b) => a.priority - b.priority);
      return newQueue;
    });
  }, []);

  // Process the queue
  useEffect(() => {
    if (!isPlayingRef.current && queue.length > 0 && !activeEvent) {
      // Dequeue the highest priority item
      const [nextEvent, ...remainingQueue] = queue;

      isPlayingRef.current = true;
      setActiveEvent(nextEvent);
      setQueue(remainingQueue);

      // Auto-clear the event after its duration
      const timer = setTimeout(() => {
        setActiveEvent(null);
        isPlayingRef.current = false;
      }, nextEvent.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [queue, activeEvent]);

  // Manual way to clear the active event early if needed
  const clearActiveEvent = useCallback(() => {
    setActiveEvent(null);
    isPlayingRef.current = false;
  }, []);

  return {
    activeEvent,
    enqueueEvent,
    clearActiveEvent,
    queueLength: queue.length,
  };
};
