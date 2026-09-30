import React from "react";
import { PaymentList } from "../Transactions/Transactions";

const Orders = () => (
  <PaymentList
    title="Orders"
    subtitle="Orders created by merchants via the Paytrixx API"
    queryKey="admin-orders"
    url="/api/admin/orders"
    statuses={["pending", "paid", "failed"]}
    idLabel="Order ID"
    idKey="orderId"
  />
);

export default Orders;
