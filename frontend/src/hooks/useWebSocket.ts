import { useEffect } from "react";

interface WebSocketOptions {
  events?: Record<string, (data: any) => void>;
}

export function useWebSocket(options?: WebSocketOptions) {
  useEffect(() => {
    // WebSocket event handling would connect to SignalR here
  }, []);

  return {
    isConnected: false,
    send: (_event: string, _data: any) => {},
  };
}
