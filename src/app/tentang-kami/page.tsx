import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STORE_NAME } from "@/utils/storeConfig";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: `Tentang Kami — ${STORE_NAME}`,
  description: `Pelajari lebih lanjut tentang ${STORE_NAME}, marketplace skincare & perawatan pribadi premium terpercaya.`,
};

export default async function TentangKamiPage() {
  const supabase = await createClient();
  const { data: pageData } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "page_tentang_kami")
    .maybeSingle();

  const page = (pageData?.value as {
    content?: string;
    visi?: string;
    misi?: string;
  }) || {};

  const content = page.content || `${STORE_NAME} adalah marketplace skincare & perawatan pribadi premium yang berkomitmen menyediakan produk berkualitas tinggi dengan harga terjangkau.`;
  const visi = page.visi || `Menjadi marketplace skincare & perawatan pribadi terpercaya yang membantu setiap orang Indonesia mendapatkan produk terbaik untuk perawatan diri.`;
  const misiRaw = page.misi || "";
  const misiList = misiRaw ? misiRaw.split("\n").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tentang Kami</h1>
          <p className="text-sm text-gray-500 mt-1">Kenali lebih dekat {STORE_NAME}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Siapa Kami?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Visi Kami</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{visi}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Misi Kami</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            {misiList.length > 0
              ? misiList.map((item, i) => <li key={i}>{item}</li>)
              : (
                <>
                  <li>Menyediakan produk skincare & perawatan pribadi berkualitas dengan harga kompetitif</li>
                  <li>Memberikan pengalaman belanja yang mudah, aman, dan menyenangkan</li>
                </>
              )}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
