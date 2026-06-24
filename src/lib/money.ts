const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export const formatIDR = (v: string | number) => {
  const n = Number(v);
  // clamp sub-rupiah float residue (incl. -0) so balances never render "-Rp 0"
  return idr.format(Math.abs(n) < 0.5 ? 0 : n);
};
export const formatQty = (v: string | number) => `${num.format(Number(v))} Kg`;
export const formatDate = (v: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
