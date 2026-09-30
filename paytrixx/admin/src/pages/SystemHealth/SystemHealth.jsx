import React from "react";
import { Box, Card, Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusChip from "../../components/common/StatusChip";

// GET /api/admin/system-health ->
// { success, data: { uptimeSec, db: { status }, paytm: { configured },
//   webhooks: { last24h, failed24h }, callbacks: { pending, failed },
//   memoryMb, nodeVersion } }

const fmtUptime = (s = 0) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

const Row = ({ label, children }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.2, borderBottom: "1px solid #eef0f4" }}>
    <Typography sx={{ fontSize: 13 }}>{label}</Typography>
    {children}
  </Box>
);

const SystemHealth = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => api.get("/api/admin/system-health").then((r) => r.data?.data),
    refetchInterval: 30_000,
  });

  const h = data || {};

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader title="System Health" subtitle="Live status of the Paytrixx backend (refreshes every 30s)" />

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>Could not reach the backend health endpoint.</Typography>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Uptime" value={fmtUptime(h.uptimeSec)} icon="schedule" color="#25B003" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Webhooks (24h)" value={h.webhooks?.last24h ?? 0} icon="webhook" color="#605DFF" hint={`${h.webhooks?.failed24h ?? 0} failed`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Callbacks Pending" value={h.callbacks?.pending ?? 0} icon="outgoing_mail" color="#ffb300" hint="Merchant notifications queued for retry" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Callbacks Failed" value={h.callbacks?.failed ?? 0} icon="error" color="#FF4023" />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", p: "20px 24px" }}>
            <Typography variant="h3" className="text-black" sx={{ fontSize: 16, fontWeight: 500, mb: 1 }}>
              Services
            </Typography>
            <Row label="MongoDB"><StatusChip status={h.db?.status === "connected" ? "ok" : "error"} /></Row>
            <Row label="Paytm credentials"><StatusChip status={h.paytm?.configured ? "ok" : "error"} /></Row>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", p: "20px 24px" }}>
            <Typography variant="h3" className="text-black" sx={{ fontSize: 16, fontWeight: 500, mb: 1 }}>
              Runtime
            </Typography>
            <Row label="Node version"><Typography sx={{ fontSize: 13 }}>{h.nodeVersion || "—"}</Typography></Row>
            <Row label="Memory (RSS)"><Typography sx={{ fontSize: 13 }}>{h.memoryMb != null ? `${h.memoryMb} MB` : "—"}</Typography></Row>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealth;
