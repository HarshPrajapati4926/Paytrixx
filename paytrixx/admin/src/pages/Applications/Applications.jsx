import React, { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  MenuItem, TextField, Typography, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import ServerTable from "../../components/common/ServerTable";
import StatusChip from "../../components/common/StatusChip";
import useListQuery from "../../hooks/useListQuery";
import { formatDateTime } from "../../utils/format";

// API contract:
//   GET  /api/admin/applications?status&search&page&limit -> { data: [...], total }
//   GET  /api/admin/applications/:id                      -> { data: full application, KYC decrypted }
//   POST /api/admin/applications/:id/approve
//   POST /api/admin/applications/:id/reject { note }

const errMsg = (e) => e.response?.data?.message || "Something went wrong";

const Row = ({ label, children }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 1, py: 0.6 }}>
    <Typography sx={{ fontSize: 13 }}>{label}</Typography>
    <Typography className="text-black" sx={{ fontSize: 13.5, wordBreak: "break-word" }}>{children || "—"}</Typography>
  </Box>
);

const Section = ({ title, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography className="text-black" sx={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>{title}</Typography>
    {children}
  </Box>
);

const Detail = ({ id, onClose }) => {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const { data: a, isLoading } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => api.get(`/api/admin/applications/${id}`).then((r) => r.data.data),
  });

  const done = (msg) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["admin-applications"] });
    qc.invalidateQueries({ queryKey: ["admin-application", id] });
    onClose();
  };
  const approve = useMutation({
    mutationFn: () => api.post(`/api/admin/applications/${id}/approve`),
    onSuccess: () => done("Application approved — merchant account created"),
    onError: (e) => toast.error(errMsg(e)),
  });
  const reject = useMutation({
    mutationFn: () => api.post(`/api/admin/applications/${id}/reject`, { note }),
    onSuccess: () => done("Application rejected"),
    onError: (e) => toast.error(errMsg(e)),
  });

  const canReview = a?.status === "submitted";

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{a?.business?.name || "Application"} {a && <StatusChip status={a.status} />}</span>
        <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading || !a ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <>
            <Section title="Account">
              <Row label="Email">{a.email} {a.emailVerified ? "(verified)" : "(not verified)"}</Row>
              <Row label="Mobile">+91 {a.phone}</Row>
              <Row label="Submitted">{formatDateTime(a.submittedAt)}</Row>
            </Section>
            <Divider sx={{ mb: 2 }} />
            <Section title="Business">
              <Row label="Name">{a.business.name}</Row>
              <Row label="Type">{a.business.type}</Row>
              <Row label="Website">{a.business.website}</Row>
              <Row label="Description">{a.business.description}</Row>
            </Section>
            <Section title="Owners">
              {a.owners.map((o, i) => (
                <Row key={i} label={`Owner ${i + 1}`}>
                  {o.name}{o.designation ? `, ${o.designation}` : ""}{o.email ? ` · ${o.email}` : ""}{o.phone ? ` · +91 ${o.phone}` : ""}
                </Row>
              ))}
            </Section>
            <Section title="Address">
              <Row label="Address">{[a.address.line1, a.address.line2, a.address.city, a.address.state, a.address.pincode].filter(Boolean).join(", ")}</Row>
            </Section>
            <Section title="Bank account">
              <Row label="Holder">{a.bank.accountHolder}</Row>
              <Row label="Bank">{a.bank.bankName}</Row>
              <Row label="Account number">{a.bank.accountNumber}</Row>
              <Row label="IFSC">{a.bank.ifsc}</Row>
            </Section>
            <Section title="Documents">
              <Row label="PAN">{a.documents.pan}</Row>
              <Row label="GSTIN">{a.documents.gst}</Row>
            </Section>
            {a.reviewNote && <Section title="Last review note"><Row label="Note">{a.reviewNote}</Row></Section>}

            {rejecting && (
              <TextField
                autoFocus fullWidth multiline minRows={3} size="small" label="Reason (shown to the applicant)"
                value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: 1 }}
                helperText="Tell them what to fix so they can resubmit."
              />
            )}
          </>
        )}
      </DialogContent>
      {canReview && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {rejecting ? (
            <>
              <Button onClick={() => setRejecting(false)} sx={{ textTransform: "none" }}>Cancel</Button>
              <Button color="error" variant="contained" disabled={note.trim().length < 5 || reject.isPending} onClick={() => reject.mutate()} sx={{ textTransform: "none" }}>
                {reject.isPending ? "Rejecting…" : "Confirm reject"}
              </Button>
            </>
          ) : (
            <>
              <Button color="error" onClick={() => setRejecting(true)} sx={{ textTransform: "none" }}>Reject</Button>
              <Button variant="contained" disabled={approve.isPending} onClick={() => approve.mutate()} sx={{ textTransform: "none" }}>
                {approve.isPending ? "Approving…" : "Approve"}
              </Button>
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

const Applications = () => {
  const [status, setStatus] = useState("submitted");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const list = useListQuery("admin-applications", "/api/admin/applications", { status, search });

  const columns = [
    { key: "businessName", label: "Business", render: (r) => <strong>{r.businessName || "—"}</strong> },
    { key: "businessType", label: "Type", render: (r) => r.businessType || "—" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Mobile", render: (r) => `+91 ${r.phone}` },
    { key: "status", label: "Status", render: (r) => <StatusChip status={r.status} /> },
    { key: "submittedAt", label: "Submitted", render: (r) => formatDateTime(r.submittedAt) },
  ];

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader title="Applications" subtitle="Merchants who registered through the Paytrixx website" />
      <ServerTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        limit={list.limit}
        loading={list.loading}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
        onRowClick={(r) => setSelected(r._id)}
        empty="No applications match this filter"
        toolbar={
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField select size="small" label="Status" value={status} sx={{ minWidth: 160 }}
              onChange={(e) => { setStatus(e.target.value); list.resetPage(); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="submitted">Awaiting review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="draft">Still registering</MenuItem>
            </TextField>
            <TextField size="small" placeholder="Search business or email" value={search} sx={{ minWidth: 240 }}
              onChange={(e) => { setSearch(e.target.value); list.resetPage(); }} />
          </Box>
        }
      />
      {selected && <Detail id={selected} onClose={() => setSelected(null)} />}
    </Box>
  );
};

export default Applications;
