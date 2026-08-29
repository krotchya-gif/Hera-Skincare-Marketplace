"use client";

import { useToast } from "@/components/Toast";
import { formatRp } from "@/utils/format";
import { Tag } from "lucide-react";

interface VoucherCardProps {
  code: string;
  type: string;
  value: number;
  min_purchase: number;
  quota: number | null;
  used_count: number;
  ends_at: string | null;
}

export default function VoucherCard({ code, type, value, min_purchase, quota, used_count, ends_at }: VoucherCardProps) {
  const { toast } = useToast();
  const isPercent = type === "percent";
  const diskonLabel = isPercent ? `${value}%` : formatRp(value);
  const minLabel = min_purchase > 0 ? `Min. ${formatRp(min_purchase)}` : "Tanpa min. belanja";
  const sisa = quota !== null ? `${Math.max(0, quota - (used_count ?? 0))} tersisa` : "Unlimited";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("success", "Kode voucher disalin!");
    } catch {
      toast("error", "Gagal menyalin kode. Coba manual.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex">
        <div className="w-20 bg-gradient-to-b from-green-500 to-green-700 flex items-center justify-center text-white">
          <Tag className="w-6 h-6" />
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">{code}</p>
              <p className="text-xs text-gray-500 mt-0.5">{diskonLabel} · {minLabel}</p>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50"
            >
              Salin
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span className="text-[10px] text-gray-400">{sisa}</span>
            {ends_at && (
              <span className="text-[10px] text-gray-400">Berlaku hingga {new Date(ends_at).toLocaleDateString("id-ID")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
