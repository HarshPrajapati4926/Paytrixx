import React, { useState } from "react";
import { Box, MenuItem, TextField } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import ServerTable from "../../components/common/ServerTable";
import StatusChip from "../../components/common/StatusChip";
import useListQuery from "../../hooks/useListQuery";
import { formatDateTime, formatINR } from "../../utils/format";

// Shared by Transactions and Orders — same shape, different endpoint/statuses.
export const PaymentList = ({ title, subtitle, queryKey, url, statuses, idLabel, idKey }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const list = useListQuery(queryKey, url, { search, status, from, to });

  const columns = [
    { key: idKey, label: idLabel, render: (r) => r[idKey] || "—" },
    { key: "orderId", label: "Order ID", render: (r) => r.orderId || "—" },
    {
      key: "merchant",
      label: "Merchant",
      render: (r) => r.merchantId?.name || r.merchantName || "—",
    },
    { key: "amount", label: "Amount", align: "right", render: (r) => formatINR(r.amount) },
    { key: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
    { key: "paytmTxnId", label: "Paytm Txn ID", render: (r) => r.paytmTxnId || "—" },
    { key: "createdAt", label: "Created", render: (r) => formatDateTime(r.createdAt) },
  ].filter((c, i, arr) => arr.findIndex((x) => x.key === c.key) === i);

  const reset = (setter) => (e) => {
    setter(e.target.value);
    list.resetPage();
  };

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
        toolbar={
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search order / txn ID"
              value={search}
              onChange={reset(setSearch)}
              sx={{ minWidth: 220 }}
            />
            <TextField select size="small" label="Status" value={status} onChange={reset(setStatus)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" type="date" label="From" value={from} onChange={reset(setFrom)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="To" value={to} onChange={reset(setTo)} InputLabelProps={{ shrink: true }} />
          </Box>
        }
      />
    </Box>
  );
};

const Transactions = () => (
  <PaymentList
    title="Transactions"
    subtitle="Every payment attempt routed through Paytm, across all merchants"
    queryKey="admin-transactions"
    url="/api/admin/transactions"
    statuses={["pending", "success", "failed"]}
    idLabel="Transaction ID"
    idKey="transactionId"
  />
);

export default Transactions;
