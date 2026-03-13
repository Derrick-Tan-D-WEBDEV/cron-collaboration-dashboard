import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export const RecentExecutions: React.FC<{ executions?: any[] }> = ({ executions = [] }) => {
  return (
    <div>
      <h3>Recent Executions</h3>
      {executions.length === 0 ? (
        <p>No recent executions.</p>
      ) : (
        <DataTable value={executions} rows={5}>
          <Column field="id" header="ID" />
          <Column field="status" header="Status" />
          <Column field="startTime" header="Start Time" />
        </DataTable>
      )}
    </div>
  );
};
