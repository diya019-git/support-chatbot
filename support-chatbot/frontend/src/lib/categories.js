// Shared visual vocabulary for the five support categories. Used by the chat
// widget (to tag bot replies), the FAQ manager, and the analytics charts -
// keeping the same color/label mapping everywhere builds a consistent
// "taxonomy" the support team can scan at a glance.

export const CATEGORIES = ["order_status", "refund", "account", "technical", "general"];

export const CATEGORY_META = {
  order_status: { label: "Order Status", color: "#3B7DD8", bg: "#E7EFFB" },
  refund: { label: "Refund", color: "#2FA66B", bg: "#E6F6EE" },
  account: { label: "Account", color: "#9B6BD9", bg: "#F1EAFB" },
  technical: { label: "Technical", color: "#E0823C", bg: "#FCEEE2" },
  general: { label: "General", color: "#6B7280", bg: "#EEF0F1" },
};

export const STATUS_META = {
  active: { label: "Active", color: "#1F4D45", bg: "#E3ECE9" },
  escalated: { label: "Escalated", color: "#D9455A", bg: "#FBE7EA" },
  resolved: { label: "Resolved", color: "#2FA66B", bg: "#E6F6EE" },
};

export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.general;
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.active;
}
