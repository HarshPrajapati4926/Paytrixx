// Static sidebar definition for the Paytrixx admin panel.
// `pages` = collapsible group, `route` only = direct link.

const navigation = [
  { key: "dashboard", name: "Dashboard", icon: "dashboard", route: "/" },
  {
    key: "merchants",
    name: "Merchants",
    icon: "storefront",
    pages: [
      { name: "All merchants", route: "/merchants" },
      { name: "Applications", route: "/applications" },
    ],
  },
  {
    key: "payments",
    name: "Payments",
    icon: "account_balance_wallet",
    pages: [
      { name: "Transactions", route: "/transactions" },
      { name: "Orders", route: "/orders" },
    ],
  },
  {
    key: "monitoring",
    name: "Monitoring",
    icon: "monitor_heart",
    pages: [
      { name: "Webhook Logs", route: "/logs/webhooks" },
      { name: "System Logs", route: "/logs/system" },
      { name: "System Health", route: "/system-health" },
    ],
  },
  { key: "support", name: "Support messages", icon: "support_agent", route: "/support-messages" },
  { key: "profile", name: "My Profile", icon: "account_circle", route: "/my-profile" },
];

export default navigation;
