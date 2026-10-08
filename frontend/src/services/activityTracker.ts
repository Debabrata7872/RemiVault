import { useEffect, useRef } from 'react';
import { recordSessionStartApi, sendHeartbeatApi } from './api';

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const HEARTBEAT_DURATION_SECONDS = 30;

/**
 * useActivityTracker
 * Automatically records session initialization (app opens)
 * and sends periodic background heartbeats while the user is actively viewing RemiVault.
 */
export function useActivityTracker(isAuthenticated: boolean, userId?: number | null) {
  const sessionRecordedRef = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      sessionRecordedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 1. Record session open once per login/active browser mount
    if (!sessionRecordedRef.current) {
      sessionRecordedRef.current = true;
      recordSessionStartApi().catch((err) => {
        console.warn('RemiVault Telemetry: session start recording failed (non-critical)', err);
      });
    }

    // 2. Start periodic heartbeat to record active time spent
    const sendPulse = () => {
      // Only accrue usage time if document is currently visible (user has tab open and focused)
      if (document.visibilityState === 'visible') {
        sendHeartbeatApi(HEARTBEAT_DURATION_SECONDS).catch(() => {
          // Silent catch for network drops
        });
      }
    };

    intervalRef.current = window.setInterval(sendPulse, HEARTBEAT_INTERVAL_MS);

    // Visibility change listener to handle tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Send a catch-up pulse when returning to active tab
        sendHeartbeatApi(5).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userId]);
}
