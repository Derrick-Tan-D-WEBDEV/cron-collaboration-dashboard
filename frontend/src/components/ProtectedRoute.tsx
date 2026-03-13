import React from "react";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For development, allow all access
  return <>{children}</>;
};

export default ProtectedRoute;
