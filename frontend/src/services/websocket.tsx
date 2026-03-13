import React, { createContext, useContext, useEffect, useRef } from "react";
import { SignalRService } from "../signalr";

interface WebSocketContextType {
  service: SignalRService | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  service: null,
  isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const serviceRef = useRef<SignalRService | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    const service = new SignalRService();
    serviceRef.current = service;

    service
      .start()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));

    return () => {
      service.stop();
    };
  }, []);

  return <WebSocketContext.Provider value={{ service: serviceRef.current, isConnected }}>{children}</WebSocketContext.Provider>;
};
