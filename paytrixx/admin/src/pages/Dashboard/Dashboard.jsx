import React from "react";
import { Box, Card, Grid, Typography } from "@mui/material";
import Chart from "react-apexcharts";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusChip from "../../components/common/StatusChip";
import { formatCompactINR, formatINR, formatDateTime } from "../../utils/format";

// GET /api/admin/stats ->
// { success, data: { totals: { merchants, activeMerchants, transactions, successAmount,
//   successRate, pending, failed }, daily: [{ date, amount, count }],
//   byStatus: { success, pending, failed }, topMerchants: [{ name, amount, count }],
//   recent: [transaction] } }

const ChartCard = ({ title, subtitle, children }) => (
  <Card className="rmui-card bg-f6f7f9 border" sx={{ boxShadow: "none", borderRadius: "7px", height: "100%" }}>
    <Box sx={{ p: "16px 20px" }}>
      <Typography variant="h3" className="text-black" sx={{ fontSize: 16, fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && <Typography sx={{ fontSize: 12 }}>{subtitle}</Typography>}
    </Box>
    <Box className="bg-white border-top" sx={{ p: "24px", borderRadius: "7px 7px 0 0" }}>
      {children}
    </Box>
  </Card>
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/api/admin/stats").then((r) => r.data?.data),
    refetchInterval: 60_000,
  });

  const t = data?.totals || {};
  const daily = data?.daily || [];
  const by = data?.byStatus || { success: 0, pending: 0, failed: 0 };
  const top = data?.topMerchants || [];
  const recent = data?.recent || [];

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader
        title="Dashboard"
        subtitle="Platform-wide payment routing overview"
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Total Volume (Paid)" value={formatCompactINR(t.successAmount)} icon="payments" color="#25B003" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Transactions" value={t.transactions ?? 0} icon="receipt_long" color="#605DFF" hint={`${t.pending ?? 0} pending · ${t.failed ?? 0} failed`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Success Rate" value={`${t.successRate ?? 0}%`} icon="task_alt" color="#3584FC" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard loading={isLoading} label="Merchants" value={t.merchants ?? 0} icon="storefront" color="#ffb300" hint={`${t.activeMerchants ?? 0} active`} />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard title="Payment Volume" subtitle="Paid amount · last 14 days">
            <Chart
              type="area"
              height={260}
              width="100%"
              series={[{ name: "Volume", data: daily.map((d) => d.amount) }]}
              options={{
                chart: { toolbar: { show: false } },
                xaxis: { categories: daily.map((d) => d.date) },
                yaxis: { labels: { formatter: (v) => formatCompactINR(v) } },
                dataLabels: { enabled: false },
                stroke: { curve: "smooth", width: 2 },
                colors: ["#605DFF"],
                tooltip: { y: { formatter: (v) => formatINR(v) } },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="Status Split" subtitle="All transactions">
            <Chart
              type="donut"
              height={260}
              width="100%"
              series={[by.success, by.pending, by.failed]}
              options={{
                labels: ["Success", "Pending", "Failed"],
                colors: ["#25B003", "#ffc107", "#FF4023"],
                legend: { position: "bottom" },
                dataLabels: { enabled: false },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title="Top Merchants" subtitle="By paid volume">
            {top.length === 0 ? (
              <Typography sx={{ fontSize: 13 }}>No data yet</Typography>
            ) : (
              <Chart
                type="bar"
                height={260}
                width="100%"
                series={[{ name: "Volume", data: top.map((m) => m.amount) }]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                  xaxis: { categories: top.map((m) => m.name), labels: { formatter: (v) => formatCompactINR(v) } },
                  dataLabels: { enabled: false },
                  colors: ["#3584FC"],
                  tooltip: { y: { formatter: (v) => formatINR(v) } },
                }}
              />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard title="Recent Transactions">
            {recent.length === 0 ? (
              <Typography sx={{ fontSize: 13 }}>No transactions yet</Typography>
            ) : (
              recent.slice(0, 7).map((tx) => (
                <Box
                  key={tx._id}
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.1, borderBottom: "1px solid #eef0f4" }}
                >
                  <Box>
                    <Typography className="text-black" sx={{ fontSize: 13, fontWeight: 600 }}>
                      {tx.orderId}
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>
                      {tx.merchantName || tx.merchantId?.name || "—"} · {formatDateTime(tx.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography className="text-black" sx={{ fontSize: 13, fontWeight: 600 }}>
                      {formatINR(tx.amount)}
                    </Typography>
                    <StatusChip status={tx.status} />
                  </Box>
                </Box>
              ))
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
