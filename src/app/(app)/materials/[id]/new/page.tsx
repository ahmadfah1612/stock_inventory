import { TransactionForm } from "@/components/transaction-form";

export default async function NewTxnPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Transaksi Baru</h1>
      <TransactionForm materialId={id} error={error} />
    </div>
  );
}
