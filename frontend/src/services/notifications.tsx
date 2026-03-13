import React, { createContext, useContext } from "react";

interface NotificationContextType {
  notify: (message: string, type?: "info" | "success" | "warning" | "error") => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notify = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    console.log(`[${type}] ${message}`);
  };

  return <NotificationContext.Provider value={{ notify }}>{children}</NotificationContext.Provider>;
};
