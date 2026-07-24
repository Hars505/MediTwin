/**
 * SocketContext — Real-time vitals & notifications via Socket.IO
 *
 * Connects to the Node.js real-time server when a user is authenticated.
 * Provides live vitals data, anomaly alerts, and notification state
 * to all child components.
 */
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/lib/api';

const SocketContext = createContext(null);

// Socket.IO real-time server URL
const REALTIME_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [liveVitals, setLiveVitals] = useState(null);
  const [anomalyAlerts, setAnomalyAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect when user is authenticated
  useEffect(() => {
    if (!user) {
      // Disconnect on logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setLiveVitals(null);
        setAnomalyAlerts([]);
      }
      return;
    }

    // Dynamic import to avoid SSR issues with socket.io-client
    let mounted = true;

    async function connectSocket() {
      try {
        const { io } = await import('socket.io-client');
        if (!mounted) return;

        const token = getToken();
        const socket = io(REALTIME_URL, {
          auth: { token },
          query: { userId: user.id, username: user.username },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 10,
        });

        socket.on('connect', () => {
          console.log('🔌 Socket.IO connected:', socket.id);
          if (mounted) setConnected(true);
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket.IO disconnected:', reason);
          if (mounted) setConnected(false);
        });

        // ── Live vitals stream ────────────────────────────────────
        socket.on('vitals_update', (data) => {
          if (mounted) {
            setLiveVitals({
              heart_rate: data.heart_rate,
              systolic_bp: data.systolic_bp,
              diastolic_bp: data.diastolic_bp,
              spo2: data.spo2,
              blood_glucose: data.blood_glucose,
              temperature: data.temperature,
              respiratory_rate: data.respiratory_rate,
              recorded_at: data.recorded_at,
            });
          }
        });

        // ── Anomaly alerts ────────────────────────────────────────
        socket.on('anomaly_alert', (data) => {
          if (mounted) {
            setAnomalyAlerts((prev) => [data, ...prev].slice(0, 20));
          }
        });

        // ── Notifications ─────────────────────────────────────────
        socket.on('notification', (data) => {
          if (mounted) {
            const notif = {
              ...data,
              _id: `temp_${Date.now()}`,
              read: false,
              created_at: new Date().toISOString(),
            };
            setNotifications((prev) => [notif, ...prev].slice(0, 50));
            setUnreadCount((prev) => prev + 1);
          }
        });

        socket.on('connect_error', (err) => {
          console.warn('Socket.IO connection error:', err.message);
        });

        socketRef.current = socket;
      } catch (err) {
        console.warn('Socket.IO import/connect failed:', err.message);
      }
    }

    connectSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Clear a single notification
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Mark all as read (visual only — call API separately for persistence)
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Submit vitals manually through the socket
  const submitVitals = useCallback((vitalsData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('submit_vitals', vitalsData);
    }
  }, []);

  const value = {
    connected,
    liveVitals,
    anomalyAlerts,
    notifications,
    unreadCount,
    setUnreadCount,
    setNotifications,
    dismissNotification,
    clearAllNotifications,
    markAllRead,
    submitVitals,
    socket: socketRef.current,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
