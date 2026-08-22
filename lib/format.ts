export function rupiah(n: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n); }
export function dateId(d: Date | string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d)); }
