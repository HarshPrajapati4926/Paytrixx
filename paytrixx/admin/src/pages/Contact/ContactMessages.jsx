import React, { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import ServerTable from "../../components/common/ServerTable";
import StatusChip from "../../components/common/StatusChip";
import useListQuery from "../../hooks/useListQuery";
import { formatDateTime } from "../../utils/format";

// GET   /api/admin/contact-messages?status&page&limit -> { data: [...], total }
// PATCH /api/admin/contact-messages/:id { status: "new" | "resolved" }

const ContactMessages = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("new");
  const [selected, setSelected] = useState(null);

  const list = useListQuery("admin-contact", "/api/admin/contact-messages", { status });

  const update = useMutation({
    mutationFn: ({ id, status: s }) => api.patch(`/api/admin/contact-messages/${id}`, { status: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contact"] });
      setSelected(null);
      toast.success("Updated");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Something went wrong"),
  });

  const columns = [
    { key: "subject", label: "Subject", render: (r) => <strong>{r.subject}</strong> },
    { key: "topic", label: "Topic" },
    { key: "name", label: "From", render: (r) => `${r.name} <${r.email}>` },
    { key: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
    { key: "createdAt", label: "Received", render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader title="Support messages" subtitle="Messages sent from the website contact form" />
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
        empty="No messages"
        toolbar={
          <TextField select size="small" label="Status" value={status} sx={{ minWidth: 150 }}
            onChange={(e) => { setStatus(e.target.value); list.resetPage(); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </TextField>
        }
      />

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {selected?.subject}
          <IconButton onClick={() => setSelected(null)} aria-label="Close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: 13, mb: 0.5 }}>
            {selected?.name} · <a href={`mailto:${selected?.email}`}>{selected?.email}</a>
            {selected?.phone ? ` · ${selected.phone}` : ""}
          </Typography>
          <Typography sx={{ fontSize: 13, mb: 2 }}>
            {selected?.topic}{selected?.business ? ` · ${selected.business}` : ""} · {formatDateTime(selected?.createdAt)}
          </Typography>
          <Typography className="text-black" sx={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{selected?.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained" sx={{ textTransform: "none" }} disabled={update.isPending}
            onClick={() => update.mutate({ id: selected._id, status: selected.status === "new" ? "resolved" : "new" })}
          >
            {selected?.status === "new" ? "Mark resolved" : "Reopen"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactMessages;
