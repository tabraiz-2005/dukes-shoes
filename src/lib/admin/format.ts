export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(iso));

/** ISO timestamp for N days ago (used for dashboard date ranges). */
export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString();
}
