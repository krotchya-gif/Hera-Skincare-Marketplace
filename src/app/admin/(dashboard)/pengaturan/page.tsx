"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Loader2, Upload, Camera, Music2, ThumbsUp } from "lucide-react";
import { useToast } from "@/components/Toast";
import AreaPicker from "@/components/AreaPicker";
import { AI_CRAWLERS } from "@/lib/ai-crawlers";
import {
  STORE_NAME,
  STORE_EMAIL,
  STORE_PHONE,
  STORE_DESCRIPTION,
  STORE_ADDRESS
} from "@/utils/storeConfig";

const tabs = ["Informasi Toko", "Pengiriman", "Pembayaran", "Notifikasi", "Admin & Hak Akses", "SEO", "Halaman Statis"];

const couriers = ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"];
const paymentMethods = ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"];
const notifEvents = [
  "Pesanan baru masuk",
  "Pembayaran diterima",
  "Stok produk menipis (< 10 item)",
  "Ulasan baru masuk",
  "Pertanyaan Q&A baru",
];
const roles = ["Admin", "Operator", "Finance (readonly)"];
const operationalDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <div onClick={onToggle} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${active ? "bg-green-500" : "bg-gray-200"}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
  </div>
);

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Informasi Toko");
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- States for Store Info ---
  const [storeName, setStoreName] = useState(STORE_NAME);
  const [storeEmail, setStoreEmail] = useState(STORE_EMAIL);
  const [storePhone, setStorePhone] = useState(STORE_PHONE);
  const [storeCity, setStoreCity] = useState("Jakarta Selatan");
  const [storeDescription, setStoreDescription] = useState(STORE_DESCRIPTION);
  const [storeAddress, setStoreAddress] = useState(STORE_ADDRESS);
  const [storeTimeStart, setStoreTimeStart] = useState("08:00");
  const [storeTimeEnd, setStoreTimeEnd] = useState("21:00");
  const [activeDays, setActiveDays] = useState<Record<string, boolean>>(
    Object.fromEntries(operationalDays.map((d, i) => [d, i < 5]))
  );
  const [igUrl, setIgUrl] = useState("");
  const [ttUrl, setTtUrl] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [waNumber, setWaNumber] = useState("6281234567890");
  // T-71/T-80: gambar latar hero beranda (settings key `hero`) — 2 ukuran
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageMobile, setHeroImageMobile] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  // --- States for Shipping ---
  const [courierToggles, setCourierToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(couriers.map((c, i) => [c, i < 3]))
  );
  const [freeShipping, setFreeShipping] = useState(true);
  const [freeShippingMin, setFreeShippingMin] = useState(100000);
  const [originCity, setOriginCity] = useState("Jakarta Selatan");
  // T-54: area asal RajaOngkir V2 (ID subdistrict) — wajib agar ongkir real aktif
  const [originAreaId, setOriginAreaId] = useState("");
  const [originAreaLabel, setOriginAreaLabel] = useState("");

  // --- States for Payment ---
  const [paymentToggles, setPaymentToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(paymentMethods.map((p) => [p, true]))
  );
  const [bankName, setBankName] = useState("BCA");
  const [bankOwner, setBankOwner] = useState("Hera Skincare");
  const [bankNumber, setBankNumber] = useState("1234567890");
  const [paymentTimeout, setPaymentTimeout] = useState(24);

  // --- States for Notifications ---
  const [notifEmail, setNotifEmail] = useState<Record<string, boolean>>(
    Object.fromEntries(notifEvents.map((n) => [n, true]))
  );
  const [notifWA, setNotifWA] = useState<Record<string, boolean>>(
    Object.fromEntries(notifEvents.map((n, i) => [n, i < 2]))
  );

  // --- States for Admins ---
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Admin");

  // --- States for SEO ---
  const [seoMetaPixelId, setSeoMetaPixelId] = useState("");
  const [seoGa4Id, setSeoGa4Id] = useState("");
  const [seoGtmId, setSeoGtmId] = useState("");
  const [seoClarityId, setSeoClarityId] = useState("");
  const [seoAdsId, setSeoAdsId] = useState("");
  const [seoTiktokId, setSeoTiktokId] = useState("");
  const [seoAiBlocked, setSeoAiBlocked] = useState<string[]>([]);
  const [seoGeoLat, setSeoGeoLat] = useState("");
  const [seoGeoLng, setSeoGeoLng] = useState("");
  const [seoGaServiceAccount, setSeoGaServiceAccount] = useState("");
  const [seoGaConfigured, setSeoGaConfigured] = useState(false); // T-56.1
  const [seoGa4PropertyId, setSeoGa4PropertyId] = useState("");
  const [seoGscSiteUrl, setSeoGscSiteUrl] = useState("");
  const [seoDefaultTitle, setSeoDefaultTitle] = useState("");
  const [seoDefaultDescription, setSeoDefaultDescription] = useState("");
  const [seoDefaultKeywords, setSeoDefaultKeywords] = useState("");
  const [seoRobotsTxt, setSeoRobotsTxt] = useState("");
  const [seoSitemapXml, setSeoSitemapXml] = useState("");

  // --- States for Static Pages ---
  const [pageTentangKami, setPageTentangKami] = useState("");
  const [pageTentangVisi, setPageTentangVisi] = useState("");
  const [pageTentangMisi, setPageTentangMisi] = useState("");
  const [karirJobs, setKarirJobs] = useState<{ title: string; type: string; location: string }[]>([]);
  const [karirContent, setKarirContent] = useState("");
  // --- States for Hubungi Kami ---
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactResponseTime, setContactResponseTime] = useState("");
  const [contactOperationalHours, setContactOperationalHours] = useState("");
  const [contactGmapsCoords, setContactGmapsCoords] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Gagal mengambil data pengaturan");
      const json = await res.json();
      const settings = json.settings;
      setAdmins(json.admins || []);

      // Load store_info settings
      if (settings.store_info) {
        setStoreName(settings.store_info.name || STORE_NAME);
        setStoreEmail(settings.store_info.email || STORE_EMAIL);
        setStorePhone(settings.store_info.phone || STORE_PHONE);
        setStoreCity(settings.store_info.city || "Jakarta Selatan");
        setStoreDescription(settings.store_info.description || STORE_DESCRIPTION);
        setStoreAddress(settings.store_info.address || STORE_ADDRESS);
        if (settings.store_info.operational_hours) {
          setStoreTimeStart(settings.store_info.operational_hours.start || "08:00");
          setStoreTimeEnd(settings.store_info.operational_hours.end || "21:00");
          const daysMap: Record<string, boolean> = {};
          operationalDays.forEach(d => {
            daysMap[d] = settings.store_info.operational_hours.days?.includes(d) || false;
          });
          setActiveDays(daysMap);
        }
        if (settings.store_info.social_media) {
          setIgUrl(settings.store_info.social_media.instagram || "");
          setTtUrl(settings.store_info.social_media.tiktok || "");
          setFbUrl(settings.store_info.social_media.facebook || "");
        }
      }
      if (settings.hero) {
        setHeroImageUrl(settings.hero.image_url || "");
        setHeroImageMobile(settings.hero.image_url_mobile || "");
      }
      if (settings.whatsapp_number) setWaNumber(settings.whatsapp_number as string);

      // Load shipping settings
      if (settings.shipping) {
        setFreeShipping(settings.shipping.free_shipping ?? true);
        setFreeShippingMin(settings.shipping.free_shipping_min ?? 100000);
        setOriginCity(settings.shipping.origin_city || "Jakarta Selatan");
        setOriginAreaId(settings.shipping.origin_area_id || "");
        setOriginAreaLabel(settings.shipping.origin_area_label || "");
        const courierMap: Record<string, boolean> = {};
        couriers.forEach(c => {
          courierMap[c] = settings.shipping.couriers?.includes(c) || false;
        });
        setCourierToggles(courierMap);
      }

      // Load payment settings
      if (settings.payment) {
        setPaymentTimeout(settings.payment.payment_timeout_hours ?? 24);
        if (settings.payment.bank_account) {
          setBankName(settings.payment.bank_account.bank || "BCA");
          setBankOwner(settings.payment.bank_account.owner || "");
          setBankNumber(settings.payment.bank_account.number || "");
        }
        const payMap: Record<string, boolean> = {};
        paymentMethods.forEach(p => {
          // Check if DB stored methods matches (since paymentMethods list uses longer descriptions)
          payMap[p] = settings.payment.methods?.some((m: string) => p.toLowerCase().includes(m.toLowerCase())) || false;
        });
        setPaymentToggles(payMap);
      }

      // Load notification settings
      if (settings.notifications) {
        if (settings.notifications.email) setNotifEmail(settings.notifications.email);
        if (settings.notifications.wa) setNotifWA(settings.notifications.wa);
      }

      // Load SEO settings
      if (settings.seo) {
        setSeoMetaPixelId(settings.seo.meta_pixel_id || "");
        setSeoGa4Id(settings.seo.ga4_measurement_id || "");
        setSeoGtmId(settings.seo.gtm_id || "");
        setSeoClarityId(settings.seo.clarity_id || "");
        setSeoAdsId(settings.seo.ads_id || "");
        setSeoTiktokId(settings.seo.tiktok_id || "");
        setSeoAiBlocked(Array.isArray(settings.seo.ai_crawlers_block) ? settings.seo.ai_crawlers_block : []);
        setSeoGeoLat(settings.seo.geo_lat || "");
        setSeoGeoLng(settings.seo.geo_lng || "");
        const sa = settings.seo.ga_service_account as Record<string, unknown> | undefined;
        // T-56.1: GET hanya mengirim penanda __configured — private key tidak
        // pernah transit browser; textarea kosong = pertahankan nilai lama
        setSeoGaConfigured(Boolean(sa && typeof sa === "object" && sa.__configured));
        setSeoGaServiceAccount("");
        setSeoGa4PropertyId(settings.seo.tracking_ga4_property_id || "");
        setSeoGscSiteUrl(settings.seo.tracking_gsc_site_url || "");
        setSeoDefaultTitle(settings.seo.default_title || "");
        setSeoDefaultDescription(settings.seo.default_description || "");
        setSeoDefaultKeywords(settings.seo.default_keywords || "");
        setSeoRobotsTxt(settings.seo.robots_txt_content || "");
        setSeoSitemapXml(settings.seo.sitemap_xml_content || "");
      }

      // Load static page content
      if (settings.page_tentang_kami) {
        setPageTentangKami(settings.page_tentang_kami.content || "");
        setPageTentangVisi(settings.page_tentang_kami.visi || "");
        setPageTentangMisi(settings.page_tentang_kami.misi || "");
      }
      if (settings.page_karir) {
        setKarirJobs(settings.page_karir.jobs || []);
        setKarirContent(settings.page_karir.content || "");
      }
      if (settings.page_hubungi_kami) {
        setContactEmail(settings.page_hubungi_kami.email || "");
        setContactPhone(settings.page_hubungi_kami.phone || "");
        setContactAddress(settings.page_hubungi_kami.address || "");
        setContactResponseTime(settings.page_hubungi_kami.response_time || "");
        setContactOperationalHours(settings.page_hubungi_kami.operational_hours || "");
        setContactGmapsCoords(settings.page_hubungi_kami.gmaps_coords || "");
      }
    } catch (err) {
      console.error("[fetchSettings]", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data pengaturan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchSettings();
    });
  }, []);

  // T-71/T-80: upload gambar hero via jalur "temp" (pola T-70 — tanpa referensi produk)
  const uploadHeroImage = async (file: File, target: "desktop" | "mobile") => {
    try {
      setHeroUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", "temp");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengupload gambar hero");
      if (target === "mobile") setHeroImageMobile(json.url);
      else setHeroImageUrl(json.url);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setHeroUploading(false);
    }
  };

  const saveStoreInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "store_info",
          value: {
            name: storeName,
            email: storeEmail,
            phone: storePhone,
            city: storeCity,
            description: storeDescription,
            address: storeAddress,
            operational_hours: {
              start: storeTimeStart,
              end: storeTimeEnd,
              days: Object.keys(activeDays).filter(d => activeDays[d])
            },
            social_media: {
              instagram: igUrl,
              tiktok: ttUrl,
              facebook: fbUrl
            }
          }
        })
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gagal menyimpan informasi toko");
      }
      // Save WhatsApp number separately
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "whatsapp_number", value: waNumber })
      });
      // T-71/T-80: gambar hero beranda (key `hero`) — kosong = gradient bawaan
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero", value: { image_url: heroImageUrl || null, image_url_mobile: heroImageMobile || null } })
      });
      toast("success", "Informasi toko berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const saveShippingInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "shipping",
          value: {
            free_shipping: freeShipping,
            free_shipping_min: Number(freeShippingMin),
            couriers: Object.keys(courierToggles).filter(c => courierToggles[c]),
            origin_city: originCity,
            origin_area_id: originAreaId,
            origin_area_label: originAreaLabel
          }
        })
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gagal menyimpan pengaturan pengiriman");
      }
      toast("success", "Pengaturan pengiriman berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const savePaymentInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "payment",
          value: {
            methods: Object.keys(paymentToggles).filter(p => paymentToggles[p]),
            payment_timeout_hours: Number(paymentTimeout),
            bank_account: {
              bank: bankName,
              owner: bankOwner,
              number: bankNumber
            }
          }
        })
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gagal menyimpan pengaturan pembayaran");
      }
      toast("success", "Pengaturan pembayaran berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "notifications",
          value: {
            email: notifEmail,
            wa: notifWA
          }
        })
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gagal menyimpan pengaturan notifikasi");
      }
      toast("success", "Pengaturan notifikasi berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const inviteAdmin = async () => {
    if (!inviteEmail) {
      toast("error", "Email wajib diisi");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_admin_role",
          email: inviteEmail,
          role: inviteRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengangkat admin");
      toast("success", "Admin berhasil diangkat!");
      setShowInviteModal(false);
      setInviteEmail("");
      fetchSettings();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (adminId: string) => {
    if (!confirm("Apakah Anda yakin ingin mencabut hak akses admin untuk pengguna ini?")) return;
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_admin",
          id: adminId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencabut admin");
      toast("success", "Hak akses admin berhasil dicabut.");
      fetchSettings();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const saveSeoSettings = async () => {
    try {
      setSaving(true);

      // T-43: parse JSON service account (validasi format — jangan simpan garbage)
      let gaServiceAccount: Record<string, unknown> | null = null;
      if (seoGaServiceAccount.trim()) {
        try {
          const parsed = JSON.parse(seoGaServiceAccount);
          if (!parsed || typeof parsed !== "object") throw new Error("invalid");
          gaServiceAccount = parsed;
        } catch {
          toast("error", "Service account harus berupa JSON yang valid.");
          return;
        }
      } else if (seoGaConfigured) {
        // T-56.1: kosong + sudah terkonfigurasi = pertahankan nilai lama di DB
        gaServiceAccount = { __configured: true };
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "seo",
          value: {
            meta_pixel_id: seoMetaPixelId,
            ga4_measurement_id: seoGa4Id,
            gtm_id: seoGtmId,
            clarity_id: seoClarityId,
            ads_id: seoAdsId,
            tiktok_id: seoTiktokId,
            ai_crawlers_block: seoAiBlocked,
            geo_lat: seoGeoLat || null,
            geo_lng: seoGeoLng || null,
            ga_service_account: gaServiceAccount,
            tracking_ga4_property_id: seoGa4PropertyId || null,
            tracking_gsc_site_url: seoGscSiteUrl || null,
            default_title: seoDefaultTitle,
            default_description: seoDefaultDescription,
            default_keywords: seoDefaultKeywords,
            robots_txt_content: seoRobotsTxt,
            sitemap_xml_content: seoSitemapXml,
          }
        })
      });
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gagal menyimpan pengaturan SEO");
      }
      toast("success", "Pengaturan SEO berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const savePageTentangKami = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "page_tentang_kami",
          value: { content: pageTentangKami, visi: pageTentangVisi, misi: pageTentangMisi }
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast("success", "Halaman Tentang Kami berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const savePageKarir = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "page_karir",
          value: { jobs: karirJobs, content: karirContent }
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast("success", "Halaman Karir berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const savePageHubungiKami = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "page_hubungi_kami",
          value: {
            email: contactEmail,
            phone: contactPhone,
            address: contactAddress,
            response_time: contactResponseTime,
            operational_hours: contactOperationalHours,
            gmaps_coords: contactGmapsCoords,
          }
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast("success", "Halaman Hubungi Kami berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "admin": return "Admin";
      case "operator": return "Operator";
      case "finance": return "Finance";
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        <p className="text-sm font-medium text-gray-500 font-sans animate-pulse">Memuat pengaturan toko...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-3xl">⚠️</div>
        <p className="text-sm font-medium text-red-600 font-sans">{error}</p>
        <button onClick={fetchSettings} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pengaturan Toko</h2>
          <p className="text-sm text-gray-500 mt-0.5">Konfigurasi toko {storeName}</p>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
          </div>
        )}
      </div>

      {/* Tab Nav */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: Informasi Toko */}
      {activeTab === "Informasi Toko" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Toko</label>
              <input 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Toko</label>
              <input 
                type="email" 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">No. WhatsApp (Notifikasi Pesanan)</label>
              <input 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Kota/Provinsi</label>
              <input 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                placeholder="Misal: Jakarta Selatan"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Deskripsi Toko</label>
              <textarea 
                rows={3} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" 
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Alamat Gudang</label>
              <textarea 
                rows={2} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" 
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
              />
            </div>
            {/* Jam Operasional */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-3">Jam Operasional</label>
              <div className="flex items-center gap-3 mb-3">
                <input 
                  type="time" 
                  value={storeTimeStart} 
                  onChange={(e) => setStoreTimeStart(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" 
                />
                <span className="text-gray-400 text-sm">sampai</span>
                <input 
                  type="time" 
                  value={storeTimeEnd} 
                  onChange={(e) => setStoreTimeEnd(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" 
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {operationalDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDays((prev) => ({ ...prev, [day]: !prev[day] }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${activeDays[day] ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            {/* Social Media */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-3">Sosial Media</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24"><Camera className="w-3.5 h-3.5 inline-block mr-1" /> Instagram</span>
                  <input 
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" 
                    placeholder="URL profil..." 
                    value={igUrl}
                    onChange={(e) => setIgUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24"><Music2 className="w-3.5 h-3.5 inline-block mr-1" /> TikTok</span>
                  <input 
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" 
                    placeholder="URL profil..." 
                    value={ttUrl}
                    onChange={(e) => setTtUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24"><ThumbsUp className="w-3.5 h-3.5 inline-block mr-1" /> Facebook</span>
                  <input 
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" 
                    placeholder="URL profil..." 
                    value={fbUrl}
                    onChange={(e) => setFbUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* T-71/T-80: Gambar Hero Beranda — 2 ukuran (desktop & mobile) */}
            <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Gambar Hero Beranda</label>
                <p className="text-[10px] text-gray-400">Latar section hero di beranda (fallback saat belum ada banner hero di Marketing → Banner). Kosong = warna gradient bawaan.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Desktop * <span className="text-gray-400 font-normal">— ±1600×500 px (rasio 16:5), JPEG/PNG/WebP maks 2MB</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${heroUploading ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                    {heroUploading ? "Mengunggah..." : (heroImageUrl ? "Ganti gambar" : "Pilih gambar")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={heroUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadHeroImage(f, "desktop");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {heroImageUrl && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImageUrl} alt="Preview hero desktop" className="w-24 h-8 rounded-lg object-cover border border-gray-200" />
                      <button onClick={() => setHeroImageUrl("")} className="text-xs text-red-600 hover:text-red-700 font-medium">
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Mobile (opsional) <span className="text-gray-400 font-normal">— ±800×600 px (rasio 4:3), JPEG/PNG/WebP maks 2MB</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${heroUploading ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                    {heroUploading ? "Mengunggah..." : (heroImageMobile ? "Ganti gambar" : "Pilih gambar")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={heroUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadHeroImage(f, "mobile");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {heroImageMobile && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImageMobile} alt="Preview hero mobile" className="w-24 h-8 rounded-lg object-cover border border-gray-200" />
                      <button onClick={() => setHeroImageMobile("")} className="text-xs text-red-600 hover:text-red-700 font-medium">
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Opsional — kosongkan untuk memakai gambar desktop di semua perangkat.</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">No. WhatsApp (tombol mengambang)</label>
              <input 
                className="w-full max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 font-mono" 
                placeholder="6281234567890" 
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 mt-1">Format: kode negara + nomor, tanpa + atau spasi. Contoh: 6281234567890</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={saveStoreInfo}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Pengiriman */}
      {activeTab === "Pengiriman" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Kurir Aktif</h3>
            <div className="space-y-3">
              {couriers.map((c) => (
                <div key={c} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{c}</span>
                  <Toggle active={courierToggles[c]} onToggle={() => setCourierToggles((prev) => ({ ...prev, [c]: !prev[c] }))} />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Gratis Ongkir</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Aktifkan gratis ongkir</span>
              <Toggle active={freeShipping} onToggle={() => setFreeShipping(!freeShipping)} />
            </div>
            {freeShipping && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum Belanja</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input 
                    type="number" 
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                    value={freeShippingMin} 
                    onChange={(e) => setFreeShippingMin(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Lokasi Asal Pengiriman</h3>
            <input
              className="w-full max-w-xs border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              placeholder="Misal: Jakarta Selatan"
            />
            <div className="mt-3 max-w-md">
              <AreaPicker
                value={originAreaId ? { id: originAreaId, label: originAreaLabel || originAreaId } : null}
                onSelect={(area) => {
                  setOriginAreaId(area?.id ?? "");
                  setOriginAreaLabel(area?.label ?? "");
                }}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                T-54: area asal (kecamatan gudang) wajib diisi agar ongkir real RajaOngkir aktif di checkout. Kosong = ongkir flat.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={saveShippingInfo}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Pembayaran */}
      {activeTab === "Pembayaran" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Metode Pembayaran Aktif</h3>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{pm}</span>
                  <Toggle active={paymentToggles[pm]} onToggle={() => setPaymentToggles((prev) => ({ ...prev, [pm]: !prev[pm] }))} />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Nomor Rekening Toko</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Bank</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                >
                  <option>BCA</option><option>Mandiri</option><option>BRI</option><option>BNI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Pemilik</label>
                <input 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nomor Rekening</label>
                <input 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Batas Waktu Pembayaran</h3>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                value={paymentTimeout}
                onChange={(e) => setPaymentTimeout(Number(e.target.value))}
              />
              <span className="text-sm text-gray-500">jam</span>
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={savePaymentInfo}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Notifikasi */}
      {activeTab === "Notifikasi" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500">Event</th>
                  <th className="text-center py-3 text-xs font-semibold text-gray-500 px-4">Email</th>
                  <th className="text-center py-3 text-xs font-semibold text-gray-500 px-4">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notifEvents.map((event) => (
                  <tr key={event} className="hover:bg-gray-50/50">
                    <td className="py-3.5 pr-4">
                      <p className="text-sm text-gray-700">🔔 {event}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        <Toggle active={notifEmail[event]} onToggle={() => setNotifEmail((p) => ({ ...p, [event]: !p[event] }))} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        <Toggle active={notifWA[event]} onToggle={() => setNotifWA((p) => ({ ...p, [event]: !p[event] }))} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end">
            <button 
              onClick={saveNotificationInfo}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Admin & Hak Akses */}
      {activeTab === "Admin & Hak Akses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{admins.length} Admin Terdaftar</p>
            <button id="btn-invite-admin" onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> Undang Admin
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal Gabung</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(admin.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 text-xs">{admin.name || "Administrator"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{admin.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${admin.role === "super_admin" ? "bg-purple-50 text-purple-700" : admin.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {getRoleLabel(admin.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {new Date(admin.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      {admin.role !== "super_admin" && (
                        <button 
                          onClick={() => removeAdmin(admin.id)}
                          disabled={saving}
                          className="text-red-400 text-xs font-semibold hover:text-red-600 hover:underline disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Undang Admin Baru</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Pelanggan Terdaftar *</label>
                    <input 
                      type="email" 
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" 
                      placeholder="admin@email.com" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Sistem akan menaikkan level akun user terdaftar dengan email ini menjadi Admin.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Role *</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      {roles.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowInviteModal(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">Batal</button>
                  <button 
                    onClick={inviteAdmin}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
                  >
                    Kirim Undangan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SEO */}
      {activeTab === "SEO" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Tracking & Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Meta Pixel ID</label>
              <input
                value={seoMetaPixelId}
                onChange={(e) => setSeoMetaPixelId(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="1234567890"
              />
              <p className="text-[10px] text-gray-400 mt-1">ID dari Facebook Events Manager</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">GA4 Measurement ID</label>
              <input
                value={seoGa4Id}
                onChange={(e) => setSeoGa4Id(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-[10px] text-gray-400 mt-1">ID dari Google Analytics 4</p>
            </div>
            {/* T-42: GTM / Clarity / Ads / TikTok */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Google Tag Manager ID</label>
              <input
                value={seoGtmId}
                onChange={(e) => setSeoGtmId(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="GTM-XXXXXXX"
              />
              <p className="text-[10px] text-gray-400 mt-1">ID dari Google Tag Manager</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Microsoft Clarity ID</label>
              <input
                value={seoClarityId}
                onChange={(e) => setSeoClarityId(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="abcdefghij"
              />
              <p className="text-[10px] text-gray-400 mt-1">Project ID dari Microsoft Clarity</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Google Ads ID</label>
              <input
                value={seoAdsId}
                onChange={(e) => setSeoAdsId(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="AW-XXXXXXXXX"
              />
              <p className="text-[10px] text-gray-400 mt-1">Conversion ID dari Google Ads</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">TikTok Pixel ID</label>
              <input
                value={seoTiktokId}
                onChange={(e) => setSeoTiktokId(e.target.value)}
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="ABCDEFGHIJKLMNOP123"
              />
              <p className="text-[10px] text-gray-400 mt-1">Pixel ID dari TikTok Ads Manager</p>
            </div>
          </div>

          {/* T-42: AI Crawler Block (GEO) */}
          <div className="border-t border-gray-100 pt-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">AI Crawler Block (GEO)</h3>
            <p className="text-[10px] text-gray-400 mb-3">Blokir bot AI tertentu di robots.txt — centang bot yang ingin diblokir</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AI_CRAWLERS.map((bot) => (
                <label key={bot} className="flex items-center gap-2 text-xs text-gray-600 border border-gray-100 rounded-lg px-3 py-2 cursor-pointer hover:border-green-300">
                  <input
                    type="checkbox"
                    checked={seoAiBlocked.includes(bot)}
                    onChange={(e) => {
                      setSeoAiBlocked((prev) =>
                        e.target.checked ? [...prev, bot] : prev.filter((b) => b !== bot)
                      );
                    }}
                    className="accent-green-600"
                  />
                  <span className="font-mono">{bot}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-5 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Latitude (GEO)</label>
                <input
                  value={seoGeoLat}
                  onChange={(e) => setSeoGeoLat(e.target.value)}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  placeholder="-6.2088"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Longitude (GEO)</label>
                <input
                  value={seoGeoLng}
                  onChange={(e) => setSeoGeoLng(e.target.value)}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  placeholder="106.8456"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Koordinat dipakai untuk JSON-LD LocalBusiness (SEO lokal / GEO)</p>
          </div>

          {/* T-43: Google API — angka real */}
          <div className="border-t border-gray-100 pt-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Google API — Angka Real (GA4 & Search Console)</h3>
            <p className="text-[10px] text-gray-400 mb-3">Isi service account (JSON) untuk menampilkan angka analytics real di halaman Marketing. Kredensial tetap di server.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Service Account JSON {seoGaConfigured && <span className="text-green-600 font-semibold">✓ terkonfigurasi (nilai disembunyikan)</span>}
                </label>
                <textarea
                  value={seoGaServiceAccount}
                  onChange={(e) => setSeoGaServiceAccount(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none font-mono"
                  placeholder={seoGaConfigured ? "Kosongkan untuk mempertahankan yang terpasang — isi ulang JSON untuk mengganti" : '{"type":"service_account","client_email":"...","private_key":"...","token_uri":"https://oauth2.googleapis.com/token"}'}
                />
                <p className="text-[10px] text-gray-400 mt-1">T-56.1: private key tidak pernah dikirim balik ke browser setelah disimpan.</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">GA4 Property ID</label>
                  <input
                    value={seoGa4PropertyId}
                    onChange={(e) => setSeoGa4PropertyId(e.target.value)}
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">GSC Site URL</label>
                  <input
                    value={seoGscSiteUrl}
                    onChange={(e) => setSeoGscSiteUrl(e.target.value)}
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                    placeholder="sc-domain:heraskincare.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Meta Tags Default</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Title</label>
                <input
                  value={seoDefaultTitle}
                  onChange={(e) => setSeoDefaultTitle(e.target.value)}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  placeholder="Hera Skincare — Marketplace Produk Rumah Tangga"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Description</label>
                <textarea
                  value={seoDefaultDescription}
                  onChange={(e) => setSeoDefaultDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                  placeholder="Deskripsi default untuk halaman marketplace"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Keywords</label>
                <input
                  value={seoDefaultKeywords}
                  onChange={(e) => setSeoDefaultKeywords(e.target.value)}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  placeholder="hera skincare, marketplace skincare, perawatan kulit, belanja online"
                />
                <p className="text-[10px] text-gray-400 mt-1">Pisahkan dengan koma</p>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-t border-gray-100 pt-5 mb-6 space-y-6">
            {/* Robots.txt Upload */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Upload robots.txt</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Upload file robots.txt atau edit manual di bawah. Kosongkan untuk menggunakan default.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Pilih File .txt
                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string;
                        setSeoRobotsTxt(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
                {seoRobotsTxt && (
                  <span className="text-xs text-green-600 font-medium">✓ File berhasil dimuat</span>
                )}
                {seoRobotsTxt && (
                  <button
                    onClick={() => { setSeoRobotsTxt(""); }}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <textarea
                value={seoRobotsTxt}
                onChange={(e) => setSeoRobotsTxt(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-green-400 resize-none"
                placeholder={`User-agent: *
Allow: /

Sitemap: ${typeof window !== "undefined" ? window.location.origin : "https://heraskincare.com"}/sitemap.xml`}
              />
            </div>

            {/* Sitemap.xml Upload */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Upload sitemap.xml</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Upload file sitemap.xml kustom atau biarkan kosong untuk menggunakan sitemap otomatis dari database.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Pilih File .xml
                  <input
                    type="file"
                    accept=".xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string;
                        setSeoSitemapXml(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
                {seoSitemapXml && (
                  <span className="text-xs text-green-600 font-medium">✓ File berhasil dimuat</span>
                )}
                {seoSitemapXml && (
                  <button
                    onClick={() => { setSeoSitemapXml(""); }}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <textarea
                value={seoSitemapXml}
                onChange={(e) => setSeoSitemapXml(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-green-400 resize-none"
                placeholder={`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${typeof window !== "undefined" ? window.location.origin : "https://heraskincare.com"}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`}
              />
              {!seoSitemapXml && (
                <p className="text-[10px] text-green-600 mt-1">
                  ✓ Sitemap otomatis aktif (generasi dinamis dari database)
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              onClick={saveSeoSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              Simpan Pengaturan SEO
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: Halaman Statis */}
      {activeTab === "Halaman Statis" && (
        <div className="space-y-6">
          {/* Tentang Kami */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Halaman Tentang Kami</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Konten Utama</label>
                <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                  value={pageTentangKami} onChange={(e) => setPageTentangKami(e.target.value)}
                  placeholder="Deskripsi tentang toko Anda..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Visi</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                  value={pageTentangVisi} onChange={(e) => setPageTentangVisi(e.target.value)}
                  placeholder="Visi perusahaan..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Misi (setiap baris = 1 item)</label>
                <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                  value={pageTentangMisi} onChange={(e) => setPageTentangMisi(e.target.value)}
                  placeholder={`Menyediakan produk berkualitas
Memberikan pelayanan terbaik
Mendukung produk lokal`} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={savePageTentangKami} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                Simpan Tentang Kami
              </button>
            </div>
          </div>

          {/* Hubungi Kami */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Halaman Hubungi Kami</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@heraskincare.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Telepon</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+6281234567890" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Alamat</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                  value={contactAddress} onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="Jl. Industri No. 45, Jakarta Selatan" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Waktu Respon</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  value={contactResponseTime} onChange={(e) => setContactResponseTime(e.target.value)} placeholder="1x24 jam" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Jam Operasional</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  value={contactOperationalHours} onChange={(e) => setContactOperationalHours(e.target.value)}
                  placeholder="Senin - Jumat, 08:00 - 21:00 WIB" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Koordinat Google Maps</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 font-mono"
                  value={contactGmapsCoords} onChange={(e) => setContactGmapsCoords(e.target.value)}
                  placeholder="-6.227341, 106.808277  (biarkan kosong jika pakai alamat)" />
                <p className="text-[10px] text-gray-400 mt-1">
                  Isi dengan koordinat latitude,longitude untuk menampilkan Google Maps. Contoh: -6.227341, 106.808277
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={savePageHubungiKami} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                Simpan Hubungi Kami
              </button>
            </div>
          </div>

          {/* Karir */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">Halaman Karir — Lowongan</h3>
              <button onClick={() => setKarirJobs([...karirJobs, { title: "", type: "Full-time", location: "" }])}
                className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700">
                <Plus className="w-3.5 h-3.5" /> Tambah Lowongan
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {karirJobs.map((job, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={job.title} onChange={(e) => {
                      const updated = [...karirJobs];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setKarirJobs(updated);
                    }} placeholder="Nama posisi" />
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400"
                    value={job.type} onChange={(e) => {
                      const updated = [...karirJobs];
                      updated[i] = { ...updated[i], type: e.target.value };
                      setKarirJobs(updated);
                    }}>
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                  <input className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={job.location} onChange={(e) => {
                      const updated = [...karirJobs];
                      updated[i] = { ...updated[i], location: e.target.value };
                      setKarirJobs(updated);
                    }} placeholder="Lokasi" />
                  <button onClick={() => setKarirJobs(karirJobs.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs font-semibold shrink-0">Hapus</button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Konten Tambahan</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                value={karirContent} onChange={(e) => setKarirContent(e.target.value)}
                placeholder="Informasi tambahan tentang karir di perusahaan Anda..." />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={savePageKarir} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                Simpan Karir
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
