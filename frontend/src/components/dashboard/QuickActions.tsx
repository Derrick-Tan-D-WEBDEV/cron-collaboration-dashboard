import React from "react";
import { Button } from "primereact/button";

export const QuickActions: React.FC = () => {
  return (
    <div>
      <h3>Quick Actions</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button label="Run Job" icon="pi pi-play" size="small" />
        <Button label="New Job" icon="pi pi-plus" size="small" severity="success" />
        <Button label="View Logs" icon="pi pi-file" size="small" severity="info" />
      </div>
    </div>
  );
};
