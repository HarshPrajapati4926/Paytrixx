import Transaction from "../../models/Transaction.js";

const DAYS = 14;

/**
 * Dashboard numbers from Transactions. Pass merchantId to scope to one merchant
 * (merchant dashboard); omit it for platform-wide totals (admin dashboard).
 */
export const getStats = async ({ merchantId } = {}) => {
  const scope = merchantId ? { merchantId } : {};

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));

  const [statusAgg, dailyAgg, topAgg, recent] = await Promise.all([
    Transaction.aggregate([
      { $match: scope },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { ...scope, status: "success", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    merchantId
      ? Promise.resolve([])
      : Transaction.aggregate([
          { $match: { status: "success" } },
          { $group: { _id: "$merchantId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { amount: -1 } },
          { $limit: 5 },
          { $lookup: { from: "merchants", localField: "_id", foreignField: "_id", as: "m" } },
          {
            $project: {
              _id: 0,
              merchantId: "$_id",
              amount: 1,
              count: 1,
              name: { $ifNull: [{ $arrayElemAt: ["$m.name", 0] }, "Unknown"] },
            },
          },
        ]),
    Transaction.find(scope).sort({ createdAt: -1 }).limit(10).populate("merchantId", "name").lean(),
  ]);

  const byStatus = { success: 0, pending: 0, failed: 0 };
  let successAmount = 0;
  let total = 0;
  for (const s of statusAgg) {
    byStatus[s._id] = s.count;
    total += s.count;
    if (s._id === "success") successAmount = s.amount;
  }
  const finished = byStatus.success + byStatus.failed;

  // Fill days with no sales so the chart axis is continuous.
  const byDay = new Map(dailyAgg.map((d) => [d._id, d]));
  const daily = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key.slice(5), amount: byDay.get(key)?.amount || 0, count: byDay.get(key)?.count || 0 };
  });

  return {
    totals: {
      transactions: total,
      successAmount,
      successRate: finished ? Math.round((byStatus.success / finished) * 100) : 0,
      pending: byStatus.pending,
      failed: byStatus.failed,
    },
    daily,
    byStatus,
    topMerchants: topAgg,
    recent,
  };
};
