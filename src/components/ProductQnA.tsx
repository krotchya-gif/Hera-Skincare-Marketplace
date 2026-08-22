"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircleQuestion, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { ProductQuestion } from "@/lib/products";

export default function ProductQnA({
  productId,
  questions,
}: {
  productId: string;
  questions: ProductQuestion[];
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Auth check di sisi client untuk UX; server tetap memvalidasi
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/profil?redirect=/produk/${productId}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/products/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, question: question.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim pertanyaan.");
      setQuestion("");
      setSuccessMsg("Pertanyaan terkirim! Jawaban akan tampil di halaman ini.");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Form bertanya */}
      <form onSubmit={handleSubmit} className="bg-gray-50/60 rounded-xl p-4 space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Punya pertanyaan tentang produk ini?
        </label>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
            placeholder="Tulis pertanyaan Anda..."
          />
          <button
            type="submit"
            disabled={submitting || !question.trim()}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Send className="w-4 h-4" /> Kirim
          </button>
        </div>
        {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        {successMsg && <p className="text-xs text-green-600">{successMsg}</p>}
        {!successMsg && (
          <p className="text-[11px] text-gray-400">
            Belum login?{" "}
            <Link href="/profil" className="text-green-600 hover:underline">
              Masuk dulu
            </Link>{" "}
            untuk bisa bertanya.
          </p>
        )}
      </form>

      {/* Daftar pertanyaan */}
      {questions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Belum ada pertanyaan. Jadilah yang pertama bertanya!
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-1">
                <MessageCircleQuestion className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">{q.question}</p>
              </div>
              {q.answer ? (
                <div className="ml-6 mt-2 bg-green-50/70 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-green-700 mb-0.5">
                    Jawaban Penjual
                  </p>
                  <p className="text-sm text-gray-700">{q.answer}</p>
                </div>
              ) : (
                <p className="ml-6 text-xs text-gray-400 italic">
                  Menunggu jawaban penjual...
                </p>
              )}
              <p className="ml-6 mt-1.5 text-[11px] text-gray-300">
                {new Date(q.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
