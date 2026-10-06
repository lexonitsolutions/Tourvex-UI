// Report catalogue: route name, API path, permissions needed to view / export (the API enforces the same).
export const REPORTS = [
  { name: "sales", title: "Sales by day and service", description: "Confirmed revenue, refunds and bookings per day, split by service type.", icon: "finance", tone: "mint", view: ["dashboard.read", "finance.read"], csv: "finance.export" },
  { name: "top-activities", title: "Top activities", description: "Which activities earn the most: bookings, travellers and revenue.", icon: "catalog", tone: "periwinkle", view: ["dashboard.read", "finance.read"], csv: "finance.export" },
  { name: "lead-funnel", title: "Lead funnel and sources", description: "Where leads come from, how far they get and how many are won.", icon: "enquiries", tone: "violet", view: ["dashboard.read", "enquiries.read"], csv: "enquiries.export" },
  { name: "support", title: "Support and SLA", description: "Tickets created and resolved, first-response SLA compliance.", icon: "tickets", tone: "butter", view: ["dashboard.read", "tickets.read"], csv: "tickets.export" },
  { name: "cancellations", title: "Cancellations and refunds", description: "Cancellation rate, refund totals and pending requests.", icon: "receipt", tone: "rose", view: ["dashboard.read", "bookings.read", "finance.read"], csv: "finance.export" },
];

export const reportByName = (name) => REPORTS.find((r) => r.name === name);
