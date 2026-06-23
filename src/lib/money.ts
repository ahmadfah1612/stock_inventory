const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export const formatIDR = (v: string | number) => idr.format(Number(v));
export const formatQty = (v: string | number) => `${num.format(Number(v))} Kg`;
export const formatDate = (v: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
