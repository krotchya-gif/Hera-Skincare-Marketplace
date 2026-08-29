import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STORE_NAME, STORE_EMAIL } from "@/utils/storeConfig";
import { createClient } from "@/utils/supabase/server";
import { MapPin } from "lucide-react";

export const metadata = {
  title: `Karir — ${STORE_NAME}`,
  description: `Bergabung bersama tim ${STORE_NAME} dan bangun karirmu di industri e-commerce.`,
};

export default async function KarirPage() {
  const supabase = await createClient();
  const { data: pageData } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "page_karir")
    .maybeSingle();

  const page = (pageData?.value as {
    jobs?: { title: string; type: string; location: string }[];
    content?: string;
  }) || {};

  const jobs = page.jobs || [];
  const content = page.content || "";

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Karir</h1>
          <p className="text-sm text-gray-500 mt-1">Bergabung bersama tim {STORE_NAME}</p>
        </div>

        {content && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Lowongan Terbuka</h2>
          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-green-200 transition-colors">
                  <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{job.type}</span>
                    <span className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline-block mr-0.5" /> {job.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Belum ada lowongan tersedia saat ini.</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Kirim lamaran ke email: hr@{STORE_EMAIL.split("@")[1] || "heraskincare.com"}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
