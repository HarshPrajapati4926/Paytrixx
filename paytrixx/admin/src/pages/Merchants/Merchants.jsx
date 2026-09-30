import React, { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  InputAdornment, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import ServerTable from "../../components/common/ServerTable";
import StatusChip from "../../components/common/StatusChip";
import useListQuery from "../../hooks/useListQuery";
import { formatDate } from "../../utils/format";

// API contract:
//   GET    /api/admin/merchants?page&limit&search        -> { success, data: [merchant], total }
//   POST   /api/admin/merchants { name, callbackUrl }     -> { success, data: merchant, apiKey, webhookSecret }  (both shown once)
//   PATCH  /api/admin/merchants/:id { isActive, name, callbackUrl }
//   POST   /api/admin/merchants/:id/regenerate-key        -> { success, apiKey }
// The list returns a masked key (`apiKeyPreview`), never the full key.

const errMsg = (e) => e.response?.data?.message || "Something went wrong";

const copy = (text) => {
  navigator.clipboard?.writeText(text);
  toast.success("Copied");
};

const Merchants = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", callbackUrl: "" });
  const [revealedKey, setRevealedKey] = useState(null);

  const list = useListQuery("admin-merchants", "/api/admin/merchants", { search });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-merchants"] });

  const create = useMutation({
    mutationFn: () => api.post("/api/admin/merchants", form).then((r) => r.data),
    onSuccess: (d) => {
      setCreateOpen(false);
      setForm({ name: "", callbackUrl: "" });
      setRevealedKey({ name: d.data?.name, apiKey: d.apiKey, webhookSecret: d.webhookSecret });
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/api/admin/merchants/${id}`, { isActive }),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e)),
  });

  const regenerate = useMutation({
    mutationFn: (m) =>
      api.post(`/api/admin/merchants/${m._id}/regenerate-key`).then((r) => ({ m, apiKey: r.data.apiKey })),
    onSuccess: ({ m, apiKey }) => {
      setRevealedKey({ name: m.name, apiKey });
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const columns = [
    { key: "name", label: "Merchant", render: (r) => <strong>{r.name}</strong> },
    { key: "apiKeyPreview", label: "API Key", render: (r) => <code>{r.apiKeyPreview || "••••••••"}</code> },
    { key: "callbackUrl", label: "Callback URL", render: (r) => r.callbackUrl || "—" },
    { key: "status", label: "Status", render: (r) => <StatusChip status={r.isActive ? "active" : "inactive"} /> },
    { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (r) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={r.isActive ? "Deactivate" : "Activate"}>
            <Switch
              size="small"
              checked={Boolean(r.isActive)}
              onChange={(e) => toggle.mutate({ id: r._id, isActive: e.target.checked })}
            />
          </Tooltip>
          <Tooltip title="Regenerate API key">
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm(`Regenerate API key for ${r.name}? The old key stops working immediately.`)) {
                  regenerate.mutate(r);
                }
              }}
            >
              <VpnKeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const canCreate = form.name.trim().length > 0;

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader
        title="Merchants"
        subtitle="Manage merchants integrated with the Paytrixx API"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ textTransform: "none" }}>
            Add Merchant
          </Button>
        }
      />

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
          <TextField
            size="small"
            placeholder="Search merchants"
            value={search}
            onChange={(e) => { setSearch(e.target.value); list.resetPage(); }}
            sx={{ minWidth: 240 }}
          />
        }
      />

      {/* Create */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Merchant</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Merchant name" size="small" fullWidth autoFocus
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Callback URL" size="small" fullWidth placeholder="https://merchant.com/payment/callback"
            value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" disabled={!canCreate || create.isPending} onClick={() => create.mutate()} sx={{ textTransform: "none" }}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* One-time key reveal */}
      <Dialog open={Boolean(revealedKey)} onClose={() => setRevealedKey(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Credentials for {revealedKey?.name}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, mb: 2 }}>
            Copy these now — they won't be shown again. Send them to the merchant over a secure channel.
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>API key (x-api-key)</Typography>
          <TextField
            fullWidth size="small" value={revealedKey?.apiKey || ""}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: 13 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => copy(revealedKey.apiKey)}><ContentCopyIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          {revealedKey?.webhookSecret && (
            <>
          <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 2, mb: 0.5 }}>
            Webhook secret (verifies the X-Paytrixx-Signature header on callbacks)
          </Typography>
          <TextField
            fullWidth size="small" value={revealedKey?.webhookSecret || ""}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: 13 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => copy(revealedKey.webhookSecret)}><ContentCopyIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ),
            }}
          />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setRevealedKey(null)} sx={{ textTransform: "none" }}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Merchants;
