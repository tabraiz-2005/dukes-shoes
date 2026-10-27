import { store } from "@/config/store";
export function money(minor: number) {
  return new Intl.NumberFormat(store.currency.locale, {
    style: "currency",
    currency: store.currency.code,
    minimumFractionDigits: store.currency.decimals,
    maximumFractionDigits: store.currency.decimals,
  }).format(minor / 10 ** store.currency.minorUnitDigits);
}
