import React, { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PageHeader from "../../components/common/PageHeader";
import ServerTable from "../../components/common/ServerTable";
import StatusChip from "../../components/common/StatusChip";
import useListQuery from "../../hooks/useListQuery";
import { formatDateTime } from "../../utils/format";

// GET /api/admin/logs?type=webhook|error|api  ->  { success, data: [{ type, status, payload, timestamp }], total }
const Logs = ({ type, title, subtitle }) => {
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  // type is fixed per page, so the query key must include it
  const list = useListQuery(`admin-logs-${type}`, "/api/admin/logs", { type, status });

  const columns = [
    { key: "timestamp", label: "Time", render: (r) => formatDateTime(r.timestamp || r.createdAt) },
    { key: "type", label: "Type", render: (r) => <StatusChip status={r.type} /> },
    { key: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
    {
      key: "summary",
      label: "Summary",
      render: (r) => {
        const p = r.payload || {};
        return p.orderId || p.ORDERID || p.message || p.path || "—";
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader title={title} subtitle={subtitle} />
      <ServerTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        limit={list.limit}
        loading={list.loading}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        onRowClick={setSelected}
        toolbar={
          <TextField
            select size="small" label="Status" value={status} sx={{ minWidth: 140 }}
            onChange={(e) => { setStatus(e.target.value); list.resetPage(); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </TextField>
        }
      />

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Log payload
          <IconButton onClick={() => setSelected(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(selected?.payload ?? selected, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export const WebhookLogs = () => (
  <Logs type="webhook" title="Webhook Logs" subtitle="Incoming Paytm webhooks and merchant callback attempts" />
);

export const SystemLogs = () => (
  <Logs type="error" title="System Logs" subtitle="Errors recorded by the platform" />
);

export default Logs;
