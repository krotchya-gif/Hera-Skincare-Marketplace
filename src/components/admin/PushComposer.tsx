"use client";

// T-64: composer broadcast push notification — tab "Push" di /admin/marketing.
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { BellRing, Loader2, Send } from "lucide-react";

interface SendResult {
  sent: number;
  failed: number;
  pruned: number;
}

export default function PushComposer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [subscribers, setSubscribers] = useState(0);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [result, setResult] = useState<SendResult | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push");
      if (res.ok) {
        const data = await res.json();
        setConfigured(Boolean(data.configured));
        setSubscribers(Number(data.subscribers) || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim push.");
      setResult(data as SendResult);
      toast("success", `Push terkirim ke ${data.sent} perangkat.`);
      loadStats();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Gagal mengirim push.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <span className="text-green-600 block mb-2"><BellRing className="w-6 h-6" /></span>
          <p className="text-2xl font-bold text-gray-900">{subscribers.toLocaleString()}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Perangkat Terdaftar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <span className="text-green-600 block mb-2"><Send className="w-6 h-6" /></span>
          <p className="text-2xl font-bold text-gray-900">{result ? result.sent : 0}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Push Terakhir Terkirim</p>
        </div>
      </div>

      {!configured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-xs text-yellow-800">
          Push belum dikonfigurasi — isi env <code className="font-mono">VAPID_PUBLIC_KEY</code>,{" "}
          <code className="font-mono">VAPID_PRIVATE_KEY</code>, <code className="font-mono">VAPID_SUBJECT</code> lalu redeploy.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Judul * (maks. 100)</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Flash Sale Skincare Hari Ini!"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Isi Pesan * (maks. 300)</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            placeholder="Diskon hingga 30% untuk semua serum — berakhir 6 jam lagi!"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Link Tujuan (opsional)</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/kategori/skincare"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !configured}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Kirim ke Semua Perangkat
        </button>
        {result && (
          <p className="text-xs text-gray-500">
            Hasil: <span className="font-semibold text-green-700">{result.sent} terkirim</span>
            {result.failed > 0 && <>, <span className="text-red-500">{result.failed} gagal</span></>}
            {result.pruned > 0 && <>, {result.pruned} langganan mati dibersihkan</>}
          </p>
        )}
      </div>
    </div>
  );
}
