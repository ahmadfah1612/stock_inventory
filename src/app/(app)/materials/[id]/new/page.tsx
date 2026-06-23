import Link from "next/link";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui";

export default async function NewTxnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  return (
    <div>
      <div className="mb-4">
        <Link href={`/materials/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Kembali ke stock card
        </Link>
      </div>
      <PageHeader title="Transaksi Baru" subtitle="Record a buy, sell, sample, or scrap" />
      <TransactionForm materialId={id} error={error} />
    </div>
  );
}
