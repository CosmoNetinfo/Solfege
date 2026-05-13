import { create } from 'zustand';

export type LogLevel = 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
}

interface DebugStore {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, details?: any) => void;
  clearLogs: () => void;
  lastQuery: {
    query: string;
    duration: number;
    timestamp: string;
  } | null;
  setLastQuery: (query: string, duration: number) => void;
  queryStats: {
    total: number;
    errors: number;
    avgTime: number;
  };
}

export const useDebugStore = create<DebugStore>((set) => ({
  logs: [],
  addLog: (level, message, details) => set((state) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };
    // Mantieni max 100 log (FIFO)
    const newLogs = [newLog, ...state.logs].slice(0, 100);
    return { logs: newLogs };
  }),
  clearLogs: () => set({ logs: [] }),
  lastQuery: null,
  setLastQuery: (query, duration) => set((state) => {
    const newTotal = state.queryStats.total + 1;
    const newAvg = (state.queryStats.avgTime * state.queryStats.total + duration) / newTotal;
    
    return {
      lastQuery: {
        query,
        duration,
        timestamp: new Date().toLocaleTimeString(),
      },
      queryStats: {
        ...state.queryStats,
        total: newTotal,
        avgTime: newAvg,
      }
    };
  }),
  queryStats: {
    total: 0,
    errors: 0,
    avgTime: 0,
  }
}));

// Utility per loggare facilmente
export const logger = {
  info: (msg: string, details?: any) => useDebugStore.getState().addLog('INFO', msg, details),
  success: (msg: string, details?: any) => useDebugStore.getState().addLog('SUCCESS', msg, details),
  error: (msg: string, details?: any) => {
    useDebugStore.getState().addLog('ERROR', msg, details);
    useDebugStore.setState((state: any) => ({ queryStats: { ...state.queryStats, errors: state.queryStats.errors + 1 } }));
  },
  warn: (msg: string, details?: any) => useDebugStore.getState().addLog('WARN', msg, details),
};
